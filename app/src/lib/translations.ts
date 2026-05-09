export const translations = {
  en: {
    // Nav
    queue: "Queue",
    analytics: "Analytics",
    settings: "Settings",
    profile: "Profile",
    commission: "Commission",
    logout: "Logout",
    login: "Login",

    // Dashboard / Queue
    my_commissions: "My Commissions",
    add_queue: "Add Queue",
    active_tasks: "Active Tasks",
    calendar: "Calendar",
    search_customer: "Search customer...",
    all_platforms: "All Platforms",
    all_statuses: "All Statuses",
    all: "All",
    working: "Working",
    confirmed_income: "Confirmed Income",
    deposits_paid: "Deposits Paid",
    awaiting_payment: "Awaiting Payment",
    
    // Analytics
    total_income: "Total Income",
    total_expenses: "Total Expenses",
    net_profit: "Net Profit",
    total_commissions: "Total Commissions",
    monthly_income: "Monthly Income",
    daily_trend: "Daily Income Trend",
    order_peak: "Order Peak Hours",
    top_work_types: "Top Work Types This Month",

    // Settings
    theme_mode: "Theme Mode",
    language: "Language",
    dark: "Dark",
    light: "Light",
    save_apply: "Save & Apply",
    preset_themes: "Preset Themes",
    custom_colors: "Custom Colors",
    
    // Card
    deadline: "Deadline",
    status: "Status",
    payment: "Payment",
    price: "Price",
    commercial: "Commercial",
    public: "Public",
    nsfw: "NSFW",
    
    // Statuses
    waiting: "Waiting",
    sketching: "Sketching",
    adding_details: "Adding Details",
    complete: "Complete",
    unpaid: "Unpaid",
    deposit: "Deposit",
    paid: "Paid"
  },
  th: {
    // Nav
    queue: "คิวงาน",
    analytics: "วิเคราะห์",
    settings: "ตั้งค่า",
    profile: "โปรไฟล์",
    commission: "รับคอมมิชชั่น",
    logout: "ออกจากระบบ",
    login: "เข้าสู่ระบบ",

    // Dashboard / Queue
    my_commissions: "รายการคอมมิชชั่น",
    add_queue: "เพิ่มคิว",
    active_tasks: "งานที่กำลังทำ",
    calendar: "ปฏิทิน",
    search_customer: "ค้นหาชื่อลูกค้า...",
    all_platforms: "ทุกแพลตฟอร์ม",
    all_statuses: "ทุกสถานะ",
    all: "ทั้งหมด",
    working: "กำลังทำ",
    confirmed_income: "รายได้ที่ยืนยันแล้ว",
    deposits_paid: "จ่ายมัดจำแล้ว",
    awaiting_payment: "รอชำระเงิน",

    // Analytics
    total_income: "รายได้รวม",
    total_expenses: "รายจ่ายรวม",
    net_profit: "กำไรสุทธิ",
    total_commissions: "จำนวนงานทั้งหมด",
    monthly_income: "รายได้รายเดือน",
    daily_trend: "แนวโน้มรายวัน",
    order_peak: "ช่วงเวลาที่คนสั่งเยอะ",
    top_work_types: "ประเภทงานยอดฮิตเดือนนี้",

    // Settings
    theme_mode: "โหมดธีม",
    language: "ภาษา",
    dark: "มืด",
    light: "สว่าง",
    save_apply: "บันทึกและนำไปใช้",
    preset_themes: "ธีมสำเร็จรูป",
    custom_colors: "ปรับแต่งสีเอง",

    // Card
    deadline: "กำหนดส่ง",
    status: "สถานะ",
    payment: "การชำระเงิน",
    price: "ราคา",
    commercial: "เชิงพาณิชย์",
    public: "สาธารณะ",
    nsfw: "NSFW",

    // Statuses
    waiting: "รอคิว",
    sketching: "ร่างภาพ",
    adding_details: "ลงรายละเอียด",
    complete: "เสร็จสิ้น",
    unpaid: "ยังไม่จ่าย",
    deposit: "มัดจำแล้ว",
    paid: "จ่ายเต็มแล้ว"
  }
};

export type TranslationKey = keyof typeof translations.en;
