#!/usr/bin/env python3
"""
Scrape current Sheng Siong Online product data into a CSV file.

The Sheng Siong site is a Meteor app. This script talks to its public DDP
WebSocket methods used by the frontend instead of scraping rendered HTML.

Default output:
  data/shengsiong_products.csv
"""

from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import json
import os
import random
import socket
import ssl
import struct
import sys
import time
from typing import Any
from urllib.parse import urlparse


DEFAULT_BASE_URL = "https://shengsiong.com.sg"
DEFAULT_OUTPUT = "data/shengsiong_products.csv"


FILTER_STATE = {
    "categoryFilter": {"slugs": []},
    "campaignPageFilter": {"slug": "", "category": {"slug": ""}},
    "shoppingListFilter": {
        "slug": "",
        "category": {"slug": ""},
        "search": {"slug": ""},
        "showKeptForLater": False,
    },
    "searchFilter": {"slug": "", "category": {"slug": ""}},
}

MISC_FILTERS = {
    "brands": {"slugs": []},
    "prices": {"slugs": []},
    "countryOfOrigins": {"slugs": []},
    "dietaryHabits": {"slugs": []},
    "tags": {"slugs": []},
    "sortBy": {"slug": ""},
}

CSV_FIELDS = [
    "id",
    "slug",
    "name",
    "brand",
    "category",
    "category_slug",
    "sku",
    "barcode",
    "size",
    "uom",
    "price",
    "usual_price",
    "carton_price",
    "origin",
    "dietary",
    "tags",
    "image_url",
    "listing_on_ecomm",
    "is_archived",
    "raw_json",
]


class WebSocketError(RuntimeError):
    pass


class MinimalWebSocket:
    """Small RFC 6455 client for text frames, enough for Meteor DDP."""

    def __init__(self, url: str, timeout: int = 30) -> None:
        parsed = urlparse(url)
        if parsed.scheme not in {"ws", "wss"}:
            raise ValueError(f"Unsupported WebSocket URL: {url}")

        self.host = parsed.hostname or ""
        self.port = parsed.port or (443 if parsed.scheme == "wss" else 80)
        self.path = parsed.path or "/"
        if parsed.query:
            self.path += f"?{parsed.query}"
        self.timeout = timeout
        self.sock: socket.socket | ssl.SSLSocket | None = None
        self.secure = parsed.scheme == "wss"

    def connect(self) -> None:
        raw_sock = socket.create_connection((self.host, self.port), timeout=self.timeout)
        raw_sock.settimeout(self.timeout)
        self.sock = ssl.create_default_context().wrap_socket(raw_sock, server_hostname=self.host) if self.secure else raw_sock

        key = base64.b64encode(os.urandom(16)).decode("ascii")
        request = (
            f"GET {self.path} HTTP/1.1\r\n"
            f"Host: {self.host}\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\n"
            "Sec-WebSocket-Version: 13\r\n"
            f"Origin: https://{self.host}\r\n"
            "User-Agent: Mozilla/5.0 ShengSiongProductScraper/1.0\r\n"
            "\r\n"
        )
        self.sock.sendall(request.encode("ascii"))
        response = self._read_http_headers()
        if " 101 " not in response.split("\r\n", 1)[0]:
            raise WebSocketError(f"WebSocket handshake failed:\n{response[:500]}")

        accept = None
        for line in response.split("\r\n")[1:]:
            if line.lower().startswith("sec-websocket-accept:"):
                accept = line.split(":", 1)[1].strip()
                break

        expected = base64.b64encode(hashlib.sha1((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").encode()).digest()).decode()
        if accept != expected:
            raise WebSocketError("WebSocket handshake returned an invalid Sec-WebSocket-Accept header.")

    def close(self) -> None:
        if self.sock:
            try:
                self._send_frame(b"", opcode=0x8)
            finally:
                self.sock.close()
                self.sock = None

    def send_text(self, text: str) -> None:
        self._send_frame(text.encode("utf-8"), opcode=0x1)

    def recv_text(self) -> str:
        while True:
            opcode, payload = self._read_frame()
            if opcode == 0x1:
                return payload.decode("utf-8")
            if opcode == 0x8:
                raise WebSocketError("WebSocket closed by remote server.")
            if opcode == 0x9:
                self._send_frame(payload, opcode=0xA)

    def _read_http_headers(self) -> str:
        assert self.sock is not None
        data = bytearray()
        while b"\r\n\r\n" not in data:
            chunk = self.sock.recv(4096)
            if not chunk:
                break
            data.extend(chunk)
        return data.decode("iso-8859-1", errors="replace")

    def _send_frame(self, payload: bytes, opcode: int = 0x1) -> None:
        assert self.sock is not None
        first = 0x80 | opcode
        length = len(payload)
        mask_key = os.urandom(4)
        if length < 126:
            header = struct.pack("!BB", first, 0x80 | length)
        elif length < 65536:
            header = struct.pack("!BBH", first, 0x80 | 126, length)
        else:
            header = struct.pack("!BBQ", first, 0x80 | 127, length)
        masked = bytes(byte ^ mask_key[i % 4] for i, byte in enumerate(payload))
        self.sock.sendall(header + mask_key + masked)

    def _read_exact(self, size: int) -> bytes:
        assert self.sock is not None
        data = bytearray()
        while len(data) < size:
            chunk = self.sock.recv(size - len(data))
            if not chunk:
                raise WebSocketError("Unexpected EOF while reading WebSocket frame.")
            data.extend(chunk)
        return bytes(data)

    def _read_frame(self) -> tuple[int, bytes]:
        head = self._read_exact(2)
        first, second = head
        opcode = first & 0x0F
        masked = bool(second & 0x80)
        length = second & 0x7F
        if length == 126:
            length = struct.unpack("!H", self._read_exact(2))[0]
        elif length == 127:
            length = struct.unpack("!Q", self._read_exact(8))[0]
        mask = self._read_exact(4) if masked else b""
        payload = self._read_exact(length)
        if masked:
            payload = bytes(byte ^ mask[i % 4] for i, byte in enumerate(payload))
        return opcode, payload


class DDPClient:
    def __init__(self, base_url: str, timeout: int = 30, verbose: bool = False) -> None:
        parsed = urlparse(base_url)
        scheme = "wss" if parsed.scheme == "https" else "ws"
        self.ws = MinimalWebSocket(f"{scheme}://{parsed.netloc}/websocket", timeout=timeout)
        self.next_id = 1
        self.verbose = verbose

    def connect(self) -> None:
        self.ws.connect()
        self._send({"msg": "connect", "version": "1", "support": ["1", "pre2", "pre1"]})
        while True:
            msg = self._recv()
            if msg.get("msg") == "connected":
                return
            if msg.get("msg") == "failed":
                raise RuntimeError(f"DDP connection failed: {msg}")

    def close(self) -> None:
        self.ws.close()

    def call(self, method: str, params: list[Any] | None = None) -> Any:
        call_id = str(self.next_id)
        self.next_id += 1
        self._send({"msg": "method", "method": method, "params": params or [], "id": call_id})

        updated = False
        has_result = False
        result: Any = None
        error: Any = None
        while True:
            msg = self._recv()
            if msg.get("msg") == "ping":
                self._send({"msg": "pong", "id": msg.get("id")})
                continue
            if msg.get("msg") == "result" and msg.get("id") == call_id:
                has_result = True
                result = msg.get("result")
                error = msg.get("error")
            elif msg.get("msg") == "updated" and call_id in msg.get("methods", []):
                updated = True
            if has_result or error is not None:
                if updated:
                    if error:
                        raise RuntimeError(f"{method} failed: {json.dumps(error, ensure_ascii=False)}")
                    return decode_ejson(result)

    def _send(self, payload: dict[str, Any]) -> None:
        if self.verbose:
            print("->", payload, file=sys.stderr)
        self.ws.send_text(json.dumps(payload, separators=(",", ":")))

    def _recv(self) -> dict[str, Any]:
        msg = json.loads(self.ws.recv_text())
        if self.verbose:
            print("<-", msg, file=sys.stderr)
        return msg


def decode_ejson(value: Any) -> Any:
    if isinstance(value, list):
        return [decode_ejson(item) for item in value]
    if isinstance(value, dict):
        if "$date" in value and len(value) == 1:
            return value["$date"]
        if value.get("$type") == "oid" and "$value" in value:
            return value["$value"]
        return {key: decode_ejson(item) for key, item in value.items()}
    return value


def pick(data: dict[str, Any], *paths: str) -> Any:
    for path in paths:
        node: Any = data
        for part in path.split("."):
            if not isinstance(node, dict) or part not in node:
                node = None
                break
            node = node[part]
        if node not in (None, "", []):
            return node
    return ""


def join_values(value: Any) -> str:
    if value in (None, ""):
        return ""
    if isinstance(value, list):
        out = []
        for item in value:
            if isinstance(item, dict):
                out.append(str(pick(item, "name", "slug", "label", "_id") or json.dumps(item, ensure_ascii=False)))
            else:
                out.append(str(item))
        return " | ".join(out)
    if isinstance(value, dict):
        return str(pick(value, "name", "slug", "label", "_id") or json.dumps(value, ensure_ascii=False))
    return str(value)


def image_url(product: dict[str, Any], base_url: str) -> str:
    candidate = pick(product, "imgUrl", "imageUrl", "img", "image", "images.0.url", "productImgUrl")
    if not candidate and isinstance(product.get("imgKeys"), list) and product["imgKeys"]:
        candidate = product["imgKeys"][0]
    if not candidate and isinstance(product.get("imgKey"), str):
        candidate = product["imgKey"]
    if not candidate:
        return ""
    candidate = str(candidate)
    if candidate.startswith("http"):
        return candidate
    if candidate.startswith("/"):
        return base_url.rstrip("/") + candidate
    if candidate == product.get("imgKey"):
        return f"https://ssecomm.s3.ap-southeast-1.amazonaws.com/products/md/{candidate}.0.jpg"
    return candidate


def normalize_product(product: dict[str, Any], base_url: str) -> dict[str, str]:
    categories = (
        product.get("categories")
        or product.get("category")
        or product.get("categoryDetails")
        or product.get("categoryKeywords")
        or []
    )
    brand = pick(product, "brand.name", "brand", "brandName")
    if isinstance(brand, dict):
        brand = pick(brand, "name", "slug", "_id")

    row = {
        "id": str(pick(product, "_id", "id", "productId")),
        "slug": str(pick(product, "slug")),
        "name": str(pick(product, "name", "displayName", "productName")),
        "brand": str(brand),
        "category": join_values(categories),
        "category_slug": join_values(product.get("categorySlugs") or product.get("categoriesSlug") or ""),
        "sku": str(pick(product, "sku", "SKU", "itemNo", "productNo")),
        "barcode": str(pick(product, "barcode", "barCode", "bcrs.barcode")),
        "size": str(pick(product, "packSize", "size", "weight", "packetSize", "uomDetails.displayText")),
        "uom": str(pick(product, "uom", "unit", "uomDetails.base", "uomDetails.id", "uomDetails.uom", "uomDetails.name")),
        "price": str(pick(product, "price", "sellingPrice", "unitPrice")),
        "usual_price": str(pick(product, "prevPrice", "usualPrice", "originalPrice", "listPrice", "strikethroughPrice")),
        "carton_price": str(pick(product, "cartonPrice")),
        "origin": join_values(pick(product, "countryOfOrigin", "countryOfOrigins", "origin")),
        "dietary": join_values(pick(product, "dietaryHabits", "dietary", "dietaryTags")),
        "tags": join_values(pick(product, "tag", "tags", "tagDetails")),
        "image_url": image_url(product, base_url),
        "listing_on_ecomm": str(pick(product, "listingOnEcomm")),
        "is_archived": str(pick(product, "isArchived")),
        "raw_json": json.dumps(product, ensure_ascii=False, sort_keys=True),
    }
    return row


def unique_products(products: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    out = []
    for product in products:
        key = pick(product, "_id", "id", "productId", "slug") or json.dumps(product, sort_keys=True)
        if key in seen:
            continue
        seen.add(key)
        out.append(product)
    return out


def scrape(args: argparse.Namespace) -> list[dict[str, Any]]:
    client = DDPClient(args.base_url, timeout=args.timeout, verbose=args.verbose)
    client.connect()
    try:
        count_result = client.call("Products.getCountByAllSlugs", [FILTER_STATE, MISC_FILTERS])
        total = int(count_result.get("count", 0)) if isinstance(count_result, dict) else 0
        print(f"Found {total} listed products.", file=sys.stderr)

        products: list[dict[str, Any]] = []
        previous_count = -1
        max_pages = args.max_pages or 10_000
        for page in range(1, max_pages + 1):
            batch = client.call("Products.getByAllSlugs", [FILTER_STATE, MISC_FILTERS, page, args.page_size])
            if not isinstance(batch, list):
                raise RuntimeError(f"Unexpected product batch for page {page}: {type(batch).__name__}")

            products = unique_products([*products, *batch])
            print(f"Page {page}: {len(products)}/{total or '?'} products", file=sys.stderr)

            if total and len(products) >= total:
                break
            if len(products) == previous_count:
                break
            previous_count = len(products)
            time.sleep(args.delay)

        return products
    finally:
        client.close()


def write_csv(products: list[dict[str, Any]], output: str, base_url: str) -> None:
    output_dir = os.path.dirname(output)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with open(output, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for product in products:
            writer.writerow(normalize_product(product, base_url))


def main() -> int:
    parser = argparse.ArgumentParser(description="Scrape Sheng Siong Online products to CSV.")
    parser.add_argument("--base-url", default=DEFAULT_BASE_URL, help=f"Default: {DEFAULT_BASE_URL}")
    parser.add_argument("--output", default=DEFAULT_OUTPUT, help=f"Default: {DEFAULT_OUTPUT}")
    parser.add_argument("--page-size", type=int, default=120, help="Products requested per page. Default: 120")
    parser.add_argument("--max-pages", type=int, default=0, help="Optional page cap for testing.")
    parser.add_argument("--delay", type=float, default=0.25, help="Delay between product calls. Default: 0.25")
    parser.add_argument("--timeout", type=int, default=30, help="Socket timeout in seconds. Default: 30")
    parser.add_argument("--verbose", action="store_true", help="Print raw DDP messages.")
    args = parser.parse_args()

    products = scrape(args)
    write_csv(products, args.output, args.base_url)
    print(f"Wrote {len(products)} products to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
