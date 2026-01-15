/**
 * Centralized translation system for easier management of multilingual text
 */

export interface TranslationDictionary {
  [key: string]: string;
}

// Define types for our translations
export interface Translations {
  [language: string]: TranslationDictionary;
}

// Define translations for both English and Arabic
export const translations: Translations = {
  English: {
    // Common UI elements
    select_language: "SELECT YOUR LANGUAGE",
    recommended: "Recommended",
    confirm: "Confirm",
    cancel: "Cancel",
    save: "Save",
    continue: "Continue",
    back: "Back",
    
    // Terms UI additions
    important_section: "This section is especially important. Please review carefully.",
    terms_hint: "Please agree to the terms and conditions to proceed",
    pending_acceptance: "Pending acceptance",
    read_terms: "Read Terms",
    review_details: "Review Details",
    accept_terms: "Accept & Continue",
    terms_progress: "Your Progress",
    ready_to_proceed: "Ready to proceed to payment",
    agree_to_terms_first: "Please agree to terms first",
    
    // Terms reminder modal
    reminder_title: "Wait! You haven't agreed to terms yet",
    reminder_message: "It looks like you've been reviewing our terms but haven't agreed to them yet. To continue with your purchase, please agree to the terms and conditions.",
    continue_reviewing: "Continue Reviewing",
    leave_anyway: "Leave Anyway",
    
    // Language names
    language_english: "English",
    language_arabic: "Arabic",
    
    // Application-specific texts
    welcome_to_dar: "Welcome to DAR Platform",
    welcome_message: "Design your perfect space with our easy-to-use platform.",
    
    // Login and Signup
    login: "Login",
    signup: "Sign up",
    email_or_phone: "Enter Email or Phone Number",
    password: "Enter Password",
    remember_me: "Remember me for 30 days",
    no_account: "Don't have an account?",
    has_account: "Already have an account?",
    create_account: "Create Account",
    enter_details: "Please enter your details",
    enter_verification_code: "Please enter the verification code sent to your phone number",
    name: "Name",
    email: "Email",
    phone: "Phone Number",
    confirm_password: "Confirm Password",
    next: "Next",
    register: "Register",
    verification_code: "Verification Code",
    code_not_received: "Didn't receive the code? Send again",
    passwords_not_match: "Passwords do not match",
    registration_success: "Registration successful! Please log in.",
    create_account_subtitle: "Please fill in the details below to sign up",
    preferred_language: "Select Preferred Language",
    account_required: "🔒 Account required for payment. Please login or create an account to continue.",
    user_created: "User created successfully, login to continue",
    error_name_length: "Name must be at least 2 characters",
    error_phone_length: "Phone must be at least 8 characters",
    registration_failed: "Registration failed",
    
    // Error messages
    error_generic: "An error occurred. Please try again.",
    error_loading: "Error loading data. Please refresh the page.",
    error_invalid_email: "Please enter a valid email address",
    error_invalid_phone: "Please enter a valid phone number",
    error_password_length: "Password must be at least 8 characters",
    
    // Toast notifications
    no_cabinets: "No Cabinets",
    please_add_cabinet: "Please add at least one cabinet before proceeding.",
    design_preview_unavailable: "Design previews are not available due to browser storage limitations.",
    
    // Account Panel
    welcome: "Welcome!",
    user: "User",
    hello_user: "Hello {name}",
    logout: "Logout",
    delete_account: "Delete Account",
    delete_account_confirm: "Delete Account?",
    delete_warning: "<strong>Warning:</strong> This action cannot be undone.<br/>All your data will be permanently deleted.",
    yes_delete: "Yes, Delete",
    account_deleted: "Account successfully deleted!",
    delete_error: "Failed to delete account: {error}",
    network_error: "Network error. Please try again.",
    auth_error: "Authentication error. Please login again.",
    
    // Success messages
    success_saved: "Successfully saved!",
    success_updated: "Successfully updated!",
    
    // WhatsApp Button
    contact_us_on_whatsapp: "Contact us on WhatsApp",
    whatsapp_default_message: "Hello! I'm interested in Dar Furniture. Could you please share your available models and prices? My name is ____.",
    
    // Material Info Modal
    material_details: "Material Details",
    description: "Description",
    features: "Features",
    zoom_in: "Zoom In",
    zoom_out: "Zoom Out",
    reset: "Reset",
    price_not_available: "Price not available",
    category_dar_base: "DAR BASE",
    category_dar_plus: "DAR PLUS",
    category_dar_lux: "DAR LUX",
    material_info: "Material Information",
    view_material_details: "View material details",
    
    // Material descriptions
    base_material_description: "DAR BASE offers economical and durable materials for everyday use. These materials provide reliable performance and a clean look for standard cabinetry.",
    plus_material_description: "DAR PLUS offers mid-range materials with enhanced features and aesthetics. These materials provide an excellent balance of quality and value for your cabinetry needs.",
    lux_material_description: "DAR LUX represents our premium line of high-end materials. These exclusive finishes offer superior quality and a sophisticated aesthetic for the discerning customer.",
    
    // Material features
    base_feature_1: "Standard durability",
    base_feature_2: "Budget-friendly option",
    base_feature_3: "Easy maintenance",
    base_feature_4: "Suitable for everyday use",
    
    plus_feature_1: "Mid-range quality",
    plus_feature_2: "Enhanced aesthetics",
    plus_feature_3: "Good value for money",
    plus_feature_4: "Variety of finishes",
    
    lux_feature_1: "Premium quality",
    lux_feature_2: "Sophisticated finish",
    lux_feature_3: "Enhanced durability",
    lux_feature_4: "Luxury appearance",
    lux_feature_5: "Exclusive selection",
    
    // Material specifications
    specifications: "Technical Specifications",
    spec_material: "Material Type",
    spec_finish: "Surface Finish",
    spec_thickness: "Thickness",
    spec_resistance: "Resistance",
    spec_application: "Typical Application",
    
    // Order and payment
    order_summary: "Order Summary",
    terms_and_conditions: "Terms and Conditions",
    agree_to_terms: "I agree to the Terms and Conditions",
    total: "Total Amount",
    subtotal: "Subtotal",
    discount: "Discount",
    proceed_to_payment: "Proceed to Payment",
    payment_success: "Payment Successful",
    payment_failed: "Payment Failed",
    order_details: "Order Details",
    order_date: "Order Date",
    delivery_date: "Delivery Date",
    order_information: "Order Information",
    order_id: "Order ID",
    status: "Status",
    order_time: "Order Time",
    customer_information: "Customer Information",
    customer_name: "Name",
    customer_phone: "Phone",
    customer_email: "Email",
    design_details: "Design Details",
    design_id: "Design ID",
    creation_date: "Creation Date",
    cabinet_count: "Cabinet Count",
    comments: "Comments",
    express_service: "Express Service",
    initial_payment: "Initial Payment",
    remaining_payment: "Remaining Payment",
    priority_production: "Priority Production Queue",
    expedited_manufacturing: "Expedited Manufacturing",
    faster_delivery: "Faster Delivery Timeline",
    dedicated_support: "Dedicated Support Contact",
    discount_code: "Discount Code",
    enter_code: "Enter code",
    apply: "Apply",
    discount_applied: "Discount of",
    applied: "applied!",
    ordered_items: "Ordered Items",
    quantity: "Quantity",
    price: "Price",
    materials: "Materials",
    no_items: "No items in this order.",
    
    // Terms and conditions sections
    term_payment: "1. Payment Terms",
    term_payment_1: "80% Payment: Customers are required to pay 80% of the total price through the system upon finalizing their design and proceeding to payment.",
    term_payment_2: "20% Payment: The remaining 20% must be paid on the delivery day before final handover.",
    term_cancellation: "2. Cancellations and Refunds",
    term_cancellation_1: "Cancellations are not allowed after payment has been processed due to the immediate purchase of materials.",
    term_cancellation_2: "Customers must confirm their designs and materials before proceeding to payment to avoid errors.",
    term_cancellation_3: "Refunds will not be issued once payment has been made.",
    term_changes: "3. Changes and Additions",
    term_changes_1: "Any additional items or design changes requested after the initial confirmation will be handled separately through customer service.",
    term_changes_2: "Additional costs incurred due to changes will be communicated and must be approved by the customer before proceeding.",
    term_materials: "4. Materials and Stock Availability",
    term_materials_1: "DAR reserves the right to inform customers if selected materials are unavailable due to supplier constraints or stock issues.",
    term_materials_2: "In such cases, customers will be contacted promptly, and alternative options will be provided for approval before production.",
    term_timeline: "5. Project Timeline",
    term_timeline_1: "Estimated timelines for design, production, and delivery will be provided upon payment.",
    term_timeline_2: "Delays caused by unforeseen circumstances, including supplier issues or logistics, will be communicated to customers promptly.",
    term_liability: "6. Liability",
    term_liability_1: "DAR is committed to delivering high-quality designs and materials. However, DAR is not liable for damages caused by:",
    term_liability_2: "Misuse or improper handling of delivered items.",
    term_liability_3: "Delays caused by events outside DAR's control (e.g., natural disasters, supplier delays).",
    term_jurisdiction: "7. Legal Jurisdiction",
    term_jurisdiction_1: "These terms and conditions are governed by the laws of the State of Kuwait.",
    term_jurisdiction_2: "Any disputes arising from these terms will be resolved in Kuwait courts.",
    term_contract: "8. Physical Contract",
    term_contract_1: "A physical contract containing these terms will be sent to customers after payment.",
    term_contract_2: "Customers must sign and return the contract before production begins.",
    term_responsibilities: "9. Customer Responsibilities",
    term_responsibilities_1: "Customers are responsible for ensuring that the dimensions and materials selected during the design process meet their requirements.",
    term_responsibilities_2: "Customers are required to review their final design thoroughly before proceeding to payment.",
    term_express: "10. DAR Express Service (Optional)",
    term_express_1: "Customers can opt for DAR Express Service for expedited production and delivery at an additional cost of 25% of the total price.",
    selected: "SELECTED",
    expedited_description: "Get expedited production and priority delivery for your order",
  },
  
  Arabic: {
    // Common UI elements
    select_language: "اختر لغتك",
    recommended: "موصى به",
    confirm: "تأكيد",
    cancel: "إلغاء",
    save: "حفظ",
    continue: "متابعة",
    back: "رجوع",
    
    // Terms UI additions
    important_section: "هذا القسم مهم بشكل خاص. يرجى المراجعة بعناية.",
    terms_hint: "يرجى الموافقة على الشروط والأحكام للمتابعة",
    pending_acceptance: "بانتظار الموافقة",
    read_terms: "قراءة الشروط",
    review_details: "مراجعة التفاصيل",
    accept_terms: "موافقة ومتابعة",
    terms_progress: "التقدّم",
    ready_to_proceed: "جاهز للمتابعة إلى الدفع",
    agree_to_terms_first: "يرجى الموافقة على الشروط أولاً",
    
    // Terms reminder modal
    reminder_title: "انتظر! لم توافق على الشروط بعد",
    reminder_message: "يبدو أنك قمت بمراجعة شروطنا لكنك لم توافق عليها بعد. للمتابعة مع عملية الشراء، يرجى الموافقة على الشروط والأحكام.",
    continue_reviewing: "متابعة المراجعة",
    leave_anyway: "الخروج على أي حال",
    
    // Language names
    language_english: "الإنجليزية",
    language_arabic: "العربية",
    
    // Application-specific texts
    welcome_to_dar: "مرحبًا بك في منصة دار",
    welcome_message: "صمم مساحتك المثالية باستخدام منصتنا سهلة الاستخدام.",
    
    // Login and Signup
    login: "تسجيل الدخول",
    signup: "إنشاء حساب",
    email_or_phone: "أدخل البريد الإلكتروني أو رقم الهاتف",
    password: "أدخل كلمة المرور",
    remember_me: "تذكرني لمدة 30 يومًا",
    no_account: "ليس لديك حساب؟",
    has_account: "لديك حساب بالفعل؟",
    create_account: "إنشاء حساب",
    enter_details: "الرجاء إدخال بياناتك",
    enter_verification_code: "الرجاء إدخال رمز التحقق المرسل إلى رقم هاتفك",
    name: "الاسم",
    email: "البريد الإلكتروني",
    phone: "رقم الهاتف",
    confirm_password: "تأكيد كلمة المرور",
    next: "التالي",
    register: "تسجيل",
    verification_code: "رمز التحقق",
    code_not_received: "لم تستلم الرمز؟ إرسال مرة أخرى",
    passwords_not_match: "كلمات المرور غير متطابقة",
    registration_success: "تم التسجيل بنجاح! الرجاء تسجيل الدخول.",
    create_account_subtitle: "يرجى ملء التفاصيل أدناه للتسجيل",
    preferred_language: "حدد اللغة المفضلة",
    account_required: "🔒 مطلوب حساب للدفع. يرجى تسجيل الدخول أو إنشاء حساب للمتابعة.",
    user_created: "تم إنشاء المستخدم بنجاح، قم بتسجيل الدخول للمتابعة",
    error_name_length: "يجب أن يكون الاسم حرفين على الأقل",
    error_phone_length: "يجب أن يتكون رقم الهاتف من 8 أرقام على الأقل",
    registration_failed: "فشل التسجيل",
    
    // Error messages
    error_generic: "حدث خطأ. يرجى المحاولة مرة أخرى.",
    error_loading: "خطأ في تحميل البيانات. يرجى تحديث الصفحة.",
    error_invalid_email: "الرجاء إدخال عنوان بريد إلكتروني صالح",
    error_invalid_phone: "الرجاء إدخال رقم هاتف صالح",
    error_password_length: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل",
    
    // Toast notifications
    no_cabinets: "لا يوجد خزائن",
    please_add_cabinet: "الرجاء إضافة خزانة واحدة على الأقل قبل المتابعة.",
    design_preview_unavailable: "معاينة التصميم غير متوفرة بسبب قيود التخزين في المتصفح.",
    
    // Account Panel
    welcome: "مرحبًا!",
    user: "مستخدم",
    hello_user: "مرحبًا {name}",
    logout: "تسجيل الخروج",
    delete_account: "حذف الحساب",
    delete_account_confirm: "حذف الحساب؟",
    delete_warning: "<strong>تحذير:</strong> لا يمكن التراجع عن هذا الإجراء.<br/>سيتم حذف جميع بياناتك بشكل دائم.",
    yes_delete: "نعم، احذف",
    account_deleted: "تم حذف الحساب بنجاح!",
    delete_error: "فشل حذف الحساب: {error}",
    network_error: "خطأ في الشبكة. يرجى المحاولة مرة أخرى.",
    auth_error: "خطأ في المصادقة. يرجى تسجيل الدخول مرة أخرى.",
    
    // Success messages
    success_saved: "تم الحفظ بنجاح!",
    success_updated: "تم التحديث بنجاح!",
    
    // WhatsApp Button
    contact_us_on_whatsapp: "تواصل معنا على واتساب",
    whatsapp_default_message: "مرحباً! أنا مهتم بأثاث دار. هل يمكنكم مشاركة الموديلات والأسعار المتاحة؟ اسمي هو ____.",
    
    // Material Info Modal
    material_details: "تفاصيل المادة",
    description: "الوصف",
    features: "المميزات",
    zoom_in: "تكبير",
    zoom_out: "تصغير",
    reset: "إعادة ضبط",
    price_not_available: "السعر غير متوفر",
    category_dar_base: "دار بيس",
    category_dar_plus: "دار بلس",
    category_dar_lux: "دار لوكس",
    material_info: "معلومات المادة",
    view_material_details: "عرض تفاصيل المادة",
    
    // Material descriptions
    base_material_description: "تقدم دار بيس مواد اقتصادية ومتينة للاستخدام اليومي. توفر هذه المواد أداء موثوقًا ومظهرًا نظيفًا للخزائن القياسية.",
    plus_material_description: "تقدم دار بلس مواد متوسطة المدى مع ميزات وجماليات محسنة. توفر هذه المواد توازنًا ممتازًا بين الجودة والقيمة لاحتياجات خزائنك.",
    lux_material_description: "تمثل دار لوكس خطنا الممتاز من المواد الفاخرة. توفر هذه التشطيبات الحصرية جودة فائقة وجماليات راقية للعملاء المميزين.",
    
    // Material features
    base_feature_1: "متانة قياسية",
    base_feature_2: "خيار اقتصادي",
    base_feature_3: "صيانة سهلة",
    base_feature_4: "مناسب للاستخدام اليومي",
    
    plus_feature_1: "جودة متوسطة",
    plus_feature_2: "جماليات محسنة",
    plus_feature_3: "قيمة جيدة مقابل المال",
    plus_feature_4: "مجموعة متنوعة من التشطيبات",
    
    lux_feature_1: "جودة ممتازة",
    lux_feature_2: "تشطيب فاخر",
    lux_feature_3: "متانة محسنة",
    lux_feature_4: "مظهر فاخر",
    lux_feature_5: "تشكيلة حصرية",
    
    // Material specifications
    specifications: "المواصفات الفنية",
    spec_material: "نوع المادة",
    spec_finish: "تشطيب السطح",
    spec_thickness: "السماكة",
    spec_resistance: "المقاومة",
    spec_application: "التطبيق النموذجي",
    
    // Order and payment
    order_summary: "ملخص الطلب",
    terms_and_conditions: "الشروط والأحكام",
    agree_to_terms: "أوافق على الشروط والأحكام",
    total: "المبلغ الإجمالي",
    subtotal: "المجموع الفرعي",
    discount: "الخصم",
    proceed_to_payment: "المتابعة إلى الدفع",
    payment_success: "تم الدفع بنجاح",
    payment_failed: "فشل الدفع",
    order_details: "تفاصيل الطلب",
    order_date: "تاريخ الطلب",
    delivery_date: "تاريخ التسليم",
    order_information: "معلومات الطلب",
    order_id: "رقم الطلب",
    status: "الحالة",
    order_time: "وقت الطلب",
    customer_information: "معلومات العميل",
    customer_name: "الاسم",
    customer_phone: "الهاتف",
    customer_email: "البريد الإلكتروني",
    design_details: "تفاصيل التصميم",
    design_id: "رقم التصميم",
    creation_date: "تاريخ الإنشاء",
    cabinet_count: "عدد الخزائن",
    comments: "التعليقات",
    express_service: "خدمة دار السريعة",
    initial_payment: "الدفعة الأولية",
    remaining_payment: "الدفعة المتبقية",
    priority_production: "أولوية في قائمة الإنتاج",
    expedited_manufacturing: "تصنيع سريع",
    faster_delivery: "مواعيد تسليم أسرع",
    dedicated_support: "دعم مخصص",
    discount_code: "كود الخصم",
    enter_code: "أدخل الكود",
    apply: "تطبيق",
    discount_applied: "تم تطبيق خصم",
    applied: "تم التطبيق!",
    ordered_items: "العناصر المطلوبة",
    quantity: "الكمية",
    price: "السعر",
    materials: "المواد",
    no_items: "لا توجد عناصر في هذا الطلب.",
    
    // Terms and conditions sections
    term_payment: "١. شروط الدفع",
    term_payment_1: "دفعة 80%: يجب على العملاء دفع 80% من السعر الإجمالي من خلال النظام بعد الانتهاء من تصميمهم والمتابعة إلى الدفع.",
    term_payment_2: "دفعة 20%: يجب دفع الـ 20% المتبقية في يوم التسليم قبل التسليم النهائي.",
    term_cancellation: "٢. الإلغاء والاسترداد",
    term_cancellation_1: "لا يُسمح بالإلغاء بعد معالجة الدفع نظرًا للشراء الفوري للمواد.",
    term_cancellation_2: "يجب على العملاء تأكيد تصاميمهم والمواد قبل المتابعة إلى الدفع لتجنب الأخطاء.",
    term_cancellation_3: "لن يتم إصدار استردادات بمجرد إجراء الدفع.",
    term_changes: "٣. التغييرات والإضافات",
    term_changes_1: "ستتم معالجة أي عناصر إضافية أو تغييرات في التصميم مطلوبة بعد التأكيد الأولي بشكل منفصل من خلال خدمة العملاء.",
    term_changes_2: "سيتم إبلاغ التكاليف الإضافية المترتبة على التغييرات ويجب أن يوافق عليها العميل قبل المتابعة.",
    term_materials: "٤. توفر المواد والمخزون",
    term_materials_1: "تحتفظ دار بالحق في إبلاغ العملاء إذا كانت المواد المحددة غير متوفرة بسبب قيود الموردين أو مشاكل المخزون.",
    term_materials_2: "في مثل هذه الحالات، سيتم الاتصال بالعملاء على الفور، وسيتم تقديم خيارات بديلة للموافقة عليها قبل الإنتاج.",
    term_timeline: "٥. الجدول الزمني للمشروع",
    term_timeline_1: "سيتم تقديم الجداول الزمنية المقدرة للتصميم والإنتاج والتسليم عند الدفع.",
    term_timeline_2: "سيتم إبلاغ العملاء على الفور بالتأخيرات الناجمة عن ظروف غير متوقعة، بما في ذلك مشاكل الموردين أو الخدمات اللوجستية.",
    term_liability: "٦. المسؤولية",
    term_liability_1: "تلتزم دار بتقديم تصاميم ومواد عالية الجودة. ومع ذلك، فإن دار ليست مسؤولة عن الأضرار الناجمة عن:",
    term_liability_2: "سوء الاستخدام أو التعامل غير السليم مع العناصر المسلمة.",
    term_liability_3: "التأخيرات الناجمة عن أحداث خارجة عن سيطرة دار (مثل الكوارث الطبيعية وتأخيرات الموردين).",
    term_jurisdiction: "٧. الاختصاص القانوني",
    term_jurisdiction_1: "تخضع هذه الشروط والأحكام لقوانين دولة الكويت.",
    term_jurisdiction_2: "سيتم حل أي نزاعات ناشئة عن هذه الشروط في محاكم الكويت.",
    term_contract: "٨. العقد المادي",
    term_contract_1: "سيتم إرسال عقد مادي يحتوي على هذه الشروط إلى العملاء بعد الدفع.",
    term_contract_2: "يجب على العملاء توقيع العقد وإعادته قبل بدء الإنتاج.",
    term_responsibilities: "٩. مسؤوليات العميل",
    term_responsibilities_1: "العملاء مسؤولون عن التأكد من أن الأبعاد والمواد المختارة خلال عملية التصميم تلبي متطلباتهم.",
    term_responsibilities_2: "يجب على العملاء مراجعة تصميمهم النهائي بدقة قبل المتابعة إلى الدفع.",
    term_express: "١٠. خدمة دار السريعة (اختيارية)",
    term_express_1: "يمكن للعملاء اختيار خدمة دار السريعة للإنتاج والتسليم المعجل بتكلفة إضافية قدرها 25% من السعر الإجمالي.",
    selected: "مختار",
    expedited_description: "احصل على إنتاج سريع وتسليم ذو أولوية لطلبك",
  }
};

/**
 * Get a translation for a given key in the specified language
 * @param key The translation key
 * @param language The language to use
 * @param fallback Optional fallback text if translation is not found
 * @param variables Optional variables to interpolate in the translation string
 * @returns Translated text or fallback or key
 */
export function getTranslation(key: string, language: string = 'English', fallback?: string, variables?: Record<string, string>): string {
  try {
    // Get the dictionary for the specified language or fall back to English
    const dictionary = translations[language] || translations['English'];
    
    // Get the translation if it exists
    let translatedText = dictionary[key];
    
    if (translatedText) {
      // If variables are provided, replace placeholders with their values
      if (variables) {
        Object.keys(variables).forEach(varName => {
          const placeholder = `{${varName}}`;
          translatedText = translatedText.replace(new RegExp(placeholder, 'g'), variables[varName] || '');
        });
      }
      return translatedText;
    }
    
    // Return fallback text if provided
    if (fallback) {
      return fallback;
    }
    
    // Return the key itself as a last resort
    return key;
  } catch (error) {
    console.error(`Translation error for key "${key}"`, error);
    return fallback || key;
  }
}

/**
 * A hook to get translations based on the current language in the store
 * @param currentLanguage Current language from the store
 * @returns A function to get translations
 */
export function createTranslator(currentLanguage: string) {
  return (key: string, fallback?: string): string => {
    return getTranslation(key, currentLanguage, fallback);
  };
}
