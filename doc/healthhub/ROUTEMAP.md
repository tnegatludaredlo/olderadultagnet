# Health Hub Route Map

这是 Health Hub 当前实现的按钮/入口跳转树。每一层的格式是：

`按钮或入口文字` -> `目标页面`

## Page Tree

```text
Root App Page
└── Health Hub
    -> health-hub/index.html

Health Hub Home
health-hub/index.html
├── 预约 section
│   └── 安排新的预约
│       -> health-hub/appointments/index.html
├── 快速链接
│   ├── 预约
│   │   -> health-hub/appointments/index.html
│   ├── 化验报告
│   │   -> health-hub/services/detail/index.html?title=Lab%20Reports&empty=lab%20reports
│   ├── 付款
│   │   -> no route yet
│   ├── 填补药物
│   │   -> no route yet
│   ├── 体检
│   │   -> no route yet
│   └── CHAS
│       -> no route yet
└── Bottom Nav
    ├── 主页
    │   -> health-hub/index.html
    ├── 服务
    │   -> health-hub/services/index.html
    └── 健康档案
        -> health-hub/records/index.html

Appointments
health-hub/appointments/index.html
├── Back
│   -> health-hub/index.html
├── Close
│   -> health-hub/index.html
└── Make new appointment
    -> health-hub/appointments/new/index.html

New Appointment: Select Healthcare Institution
health-hub/appointments/new/index.html
├── Back
│   -> health-hub/appointments/index.html
├── Close
│   -> health-hub/index.html
├── Book Polyclinic Appointment
│   -> health-hub/appointments/new/book-polyclinic/index.html
├── Setup Preferred Polyclinics
│   -> #
├── Alexandra Hospital
│   -> #
├── Changi General Hospital
│   -> #
├── Institute of Mental Health
│   -> #
└── Other hospital rows
    -> #

New Appointment: Book Polyclinic
health-hub/appointments/new/book-polyclinic/index.html
├── Back
│   -> health-hub/appointments/new/index.html
├── Close
│   -> health-hub/index.html
├── Service Type card / Change
│   -> health-hub/appointments/new/book-polyclinic/service-type/index.html
├── Location card / Select
│   -> health-hub/appointments/new/book-polyclinic/location/index.html
└── Book an appointment
    -> health-hub/appointments/new/book-polyclinic/request/index.html

Select Service Type
health-hub/appointments/new/book-polyclinic/service-type/index.html
├── Back
│   -> health-hub/appointments/new/book-polyclinic/index.html
├── Close
│   -> health-hub/index.html
├── Any service option
│   ├── Saves selected text to localStorage: healthhub.selectedService
│   └── Returns to health-hub/appointments/new/book-polyclinic/index.html
└── Back button at bottom
    -> health-hub/appointments/new/book-polyclinic/index.html

Select Location
health-hub/appointments/new/book-polyclinic/location/index.html
├── Back
│   -> health-hub/appointments/new/book-polyclinic/index.html
├── Close
│   -> health-hub/index.html
├── Any polyclinic row
│   ├── Saves selected polyclinic to localStorage: healthhub.selectedLocation
│   └── Returns to health-hub/appointments/new/book-polyclinic/index.html
└── Back button at bottom
    -> health-hub/appointments/new/book-polyclinic/index.html

Appointment Request Form
health-hub/appointments/new/book-polyclinic/request/index.html
├── Back
│   -> health-hub/appointments/new/book-polyclinic/index.html
├── Close
│   -> health-hub/index.html
├── Preferred Institution dropdown
│   └── Shows value from localStorage: healthhub.selectedLocation
├── Please select a service dropdown
│   └── Opens inline service dropdown, no page navigation
├── Date of Birth field
│   └── Opens inline calendar card, no page navigation
├── Submit
│   ├── Enabled after required fields are filled
│   ├── Saves form to localStorage: healthhub.appointmentRequest
│   └── Goes to health-hub/appointments/new/book-polyclinic/request/confirmation/index.html
└── Cancel
    -> health-hub/appointments/new/book-polyclinic/index.html

Appointment Confirmation
health-hub/appointments/new/book-polyclinic/request/confirmation/index.html
├── Back
│   -> health-hub/appointments/new/book-polyclinic/request/index.html
├── Close
│   -> health-hub/index.html
└── Done
    -> health-hub/index.html

Services
health-hub/services/index.html
├── Search field
│   -> no route, visual input only
├── 常用服务
│   ├── 疫苗接种记录
│   │   -> health-hub/services/detail/index.html?title=Vaccination%20Records&empty=vaccination%20records
│   ├── 化验报告
│   │   -> health-hub/services/detail/index.html?title=Lab%20Reports&empty=lab%20reports
│   ├── 付款
│   │   -> health-hub/services/detail/index.html?title=Payments&empty=payment%20records
│   ├── 填补药物
│   │   -> health-hub/services/detail/index.html?title=Medication%20Refills&empty=medication%20refills
│   ├── 体检
│   │   -> health-hub/services/detail/index.html?title=Health%20Screening&empty=health%20screening%20records
│   └── CHAS
│       -> health-hub/services/detail/index.html?title=CHAS&empty=CHAS%20records
├── 服务类别
│   ├── 健康SG
│   │   -> health-hub/services/detail/index.html?title=Healthier%20SG&empty=Healthier%20SG%20records
│   ├── 预约
│   │   -> health-hub/appointments/index.html
│   ├── 药物
│   │   -> health-hub/services/detail/index.html?title=Medication&empty=medication%20records
│   ├── 付款与财务
│   │   -> health-hub/services/detail/index.html?title=Payment%20%26%20Finance&empty=payment%20and%20finance%20records
│   ├── 健康记录
│   │   -> health-hub/services/detail/index.html?title=Health%20Records&empty=health%20records
│   ├── 健康评估
│   │   -> health-hub/services/detail/index.html?title=Health%20Assessment&empty=health%20assessment%20records
│   └── 同意与许可
│       -> health-hub/services/detail/index.html?title=Consent%20%26%20Permission&empty=consent%20and%20permission%20records
└── Bottom Nav
    ├── 主页
    │   -> health-hub/index.html
    ├── 服务
    │   -> health-hub/services/index.html
    └── 健康档案
        -> health-hub/records/index.html

Service Empty Detail
health-hub/services/detail/index.html
├── Back
│   -> health-hub/services/index.html
├── Close
│   -> health-hub/index.html
└── Dynamic content
    ├── Header title comes from query parameter: title
    └── Empty state text comes from query parameter: empty

Health Records
health-hub/records/index.html
├── MXXXX437J card
│   -> health-hub/services/detail/index.html?title=Health%20Records&empty=health%20records
├── 我的看护者
│   └── 添加看护者
│       -> health-hub/services/detail/index.html?title=Caregivers&empty=caregiver%20records
├── 我的看护对象
│   ├── 我的孩子 / 添加亲人
│   │   -> health-hub/services/detail/index.html?title=Family%20Health%20Records&empty=family%20health%20records
│   └── 家人和朋友 / 添加亲人
│       -> health-hub/services/detail/index.html?title=Family%20Health%20Records&empty=family%20health%20records
└── Bottom Nav
    ├── 主页
    │   -> health-hub/index.html
    ├── 服务
    │   -> health-hub/services/index.html
    └── 健康档案
        -> health-hub/records/index.html
```

## Shared State

```text
healthhub.selectedService
├── Written by: Select Service Type page
└── Read by: Book Polyclinic page

healthhub.selectedLocation
├── Written by: Select Location page
├── Read by: Book Polyclinic page
└── Read by: Appointment Request form Preferred Institution field

healthhub.appointmentRequest
├── Written by: Appointment Request Submit
└── Read by: Appointment Confirmation page
```
