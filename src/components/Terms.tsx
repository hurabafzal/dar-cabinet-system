import React, { useEffect, useState } from "react";
import axios from "axios";
import { Form, Container, Row, Col, Card, Accordion } from "react-bootstrap";
import { useTranslation } from '../hooks/useTranslation';
import { getStorageItem, setStorageItem } from '../utils/storageUtils';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFullOrderData, useOrderStore } from '../store/orderStore';
import { useDraftStore } from '../store/draftStore';
import { CREATE_ORDER, GET_ORDER, GET_DISCOUNT_CODE, CREATE_INVOICE_CHARGE } from '../apiURL/endpoints';

// Components
import DesignPreview from './ordersummary/DesignPreview';
import OrderInformation from './ordersummary/OrderInformation';
import CustomerInformation from './ordersummary/CustomerInformation';
import DesignDetails from './ordersummary/DesignDetails';
import OrderedItems from './ordersummary/OrderedItems';
import PriceSummary from './ordersummary/PriceSummary';

interface LineItem {
  itemId: string;
  amount: string;
  price: string | number;
  quantity: string;
  description: string;
  name: string;
  [key: string]: any;
}

interface OrderPayload {
  invoiceDate: string;
  status: string;
  userType: string;
  customerId: string;
  paymentTerms: string;
  items: LineItem[];
  grossAmount: string;
  discount: string;
  totalAmount: string;
  comments?: string;
  invoiceType: string;
  measurementDescription?: string;
  measurementId?: string;
  invoiceNumber: string;
  referenceNo?: string;
  estimatedDeliveryDate?: string;
  files?: any[];
  orderType?: string;
}

// Safely coerce any number/string to a usable number
const toNum = (v: unknown): number => {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  }
  return 0;
};

async function compressImage(base64Image: string, maxWidth: number = 800, quality: number = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas-Kontext konnte nicht erstellt werden'));
        return;
      }

      const compressedImage = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedImage);
    };

    img.onerror = (error) => {
      reject(error);
    };

    img.src = base64Image;
  });
}

function Terms() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const designId = searchParams.get("designId");
  const orderData = useFullOrderData();

  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  const [termsProgress, setTermsProgress] = useState<number>(0);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);
  const [highlightedSection, setHighlightedSection] = useState<number | null>(null);
  const [showReminderModal, setShowReminderModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [discountCode, setDiscountCode] = useState({ name: "", discount: 0 });
  const [totalPrice, setTotalPrice] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [designData, setDesignData] = useState({
    name: "",
    measurment: "",
    measurementDate: "",
    comments: "",
    createdAt: "",
    lineItems: [] as LineItem[],
    customerId: "",
  });
  const [expressService, setExpressService] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const navigate = useNavigate();
  const actualDesignId = designId || orderData?.orderInfo?.orderId || orderData?.designDetails?.designId || orderData?.apiResponse?._id;
  
  // ✅ Create reactive orderInfo that shows invoice number when available
  const displayOrderInfo = React.useMemo(() => {
    if (!orderData?.orderInfo) return null;
    
    // Use invoiceNumber state if available, otherwise use orderData.orderInfo.orderId
    const finalOrderId = invoiceNumber || orderData.orderInfo.orderId;
    
    return {
      ...orderData.orderInfo,
      orderId: finalOrderId
    };
  }, [orderData?.orderInfo, invoiceNumber]);

  const handleGoBack = () => {
    const userid = searchParams.get("userid") || orderData?.apiResponse?.customerId;
    window.location.href = `/?userid=${userid}`;
  };

  const formatDateToISO = (dateInput: string | Date | null | undefined): string => {
    if (!dateInput) {
      return new Date().toISOString();
    }
    if (dateInput instanceof Date) {
      if (isNaN(dateInput.getTime())) {
        return new Date().toISOString();
      }
      return dateInput.toISOString();
    }
    if (typeof dateInput === 'string') {
      try {
        if (dateInput.includes('/')) {
          const parts = dateInput.split('/');
          if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
              return date.toISOString();
            }
          }
        }
        const date = new Date(dateInput);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      } catch (e) {
        console.error("Fehler beim Parsen des Datums:", e);
      }
    }
    return new Date().toISOString();
  };

  // Helper function to get component price per cabinet
  const getComponentPriceForItem = (item: any, component: string): number => {
    const componentLower = component.toLowerCase();

    // Priority 1: item.components with explicit price
    if (item.components?.[component]?.price && item.components[component].price > 0) {
      return item.components[component].price;
    }
    // Priority 2: item[componentLower].Price
    if (item[componentLower]?.Price && item[componentLower].Price > 0) {
      return item[componentLower].Price;
    }
    // Priority 3: distribute computed price
    const totalComputedPrice = orderData?.computedPrice?.[component] || 0;
    const cabinetCount = orderData?.fullModelData?.length || 1;
    if (totalComputedPrice > 0) {
      return totalComputedPrice / cabinetCount;
    }
    return 0;
  };

  const lineItems: LineItem[] = designData.lineItems?.length > 0
    ? designData.lineItems
    : orderData?.fullModelData?.map((item: any) => {
        const framePrice = getComponentPriceForItem(item, 'Frame');
        const shelfPrice = getComponentPriceForItem(item, 'Shelf');
        const doorPrice = getComponentPriceForItem(item, 'Door');
        const drawerPrice = getComponentPriceForItem(item, 'Drawer');

        const calculatedTotalPrice = framePrice + shelfPrice + doorPrice + drawerPrice;
        const finalTotalPrice = (item.totalPrice && item.totalPrice > 0)
          ? item.totalPrice
          : calculatedTotalPrice;

        return {
          itemId: item.uuid,
          amount: finalTotalPrice.toString(),
          price: finalTotalPrice,
          quantity: "1",
          description: item.id,
          name: item.id,
          _id: item.uuid,
          uuid: item.uuid,
          frame: { Price: framePrice },
          shelf: { Price: shelfPrice },
          door: { Price: doorPrice },
          drawer: { Price: drawerPrice },
          ...item
        };
      }) || [];

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Recalculate totals whenever price-related data changes
  useEffect(() => {
    calculateTotal();
  }, [discountCode, expressService, orderData]);

  // ✅ Create order/invoice when Terms page loads (if not already created)
  // Use a ref to prevent multiple order creations
  const orderCreationAttempted = React.useRef(false);
  
  useEffect(() => {
    const createOrderIfNeeded = async () => {
      // Prevent multiple attempts
      if (orderCreationAttempted.current) {
        return;
      }
      
      // Check if order already exists (invoice number is different from measurement ID)
      if (orderData?.orderInfo?.orderId && orderData?.apiResponse) {
        const currentOrderId = orderData.orderInfo.orderId;
        const measurementId = orderData.apiResponse._id || orderData.designDetails?.designId;
        
        // If orderId is the same as measurement ID, order hasn't been created yet
        if (currentOrderId === measurementId && /^[0-9a-fA-F]{24}$/.test(currentOrderId)) {
          orderCreationAttempted.current = true; // Mark as attempted
          
          try {
            // Build the item list from API response (same as handleProceed)
            const apiItems = (orderData.apiResponse.lineItems || []).map((item: any) => ({
              itemId: item._id,
              item: item.name,
              description: item.description,
              quantity: "1",
              price: (item.price || 0).toString(),
              amount: (item.price || 0).toString(),
              status: "PENDING"
            }));

            if (apiItems.length === 0) {
              orderCreationAttempted.current = false; // Reset to allow retry
              return;
            }

            const itemsTotal = apiItems.reduce((sum: number, item: any) => sum + parseFloat(item.price || 0), 0);
            const grossAmount = itemsTotal;
            const discountAmount = 0;
            const totalAmount = itemsTotal;

            // Helper function to convert base64 to File
            const base64ToFile = (base64: string, filename: string): File => {
              const arr = base64.split(',');
              const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
              const bstr = atob(arr[1]);
              let n = bstr.length;
              const u8arr = new Uint8Array(n);
              while (n--) {
                u8arr[n] = bstr.charCodeAt(n);
              }
              return new File([u8arr], filename, { type: mime });
            };

            // Convert screenshots to files
            const screenshotFiles: File[] = [];
            if (orderData.designScreenshots) {
              try {
                if (orderData.designScreenshots.back) {
                  screenshotFiles.push(base64ToFile(orderData.designScreenshots.back, 'design-back-view.jpg'));
                }
                if (orderData.designScreenshots.front) {
                  screenshotFiles.push(base64ToFile(orderData.designScreenshots.front, 'design-front-view.jpg'));
                }
                if (orderData.designScreenshots.left) {
                  screenshotFiles.push(base64ToFile(orderData.designScreenshots.left, 'design-left-view.jpg'));
                }
                if (orderData.designScreenshots.right) {
                  screenshotFiles.push(base64ToFile(orderData.designScreenshots.right, 'design-right-view.jpg'));
                }
              } catch (error) {
                console.error('Error processing screenshots:', error);
              }
            }

            // Build order payload (exactly same as handleProceed)
            const orderPayload: any = {
              invoiceDate: formatDateToISO(orderData.orderInfo.orderDate),
              status: "SAVED",
              userType: "Customer",
              customerId: orderData.apiResponse.customerId,
              measurementId: orderData.apiResponse._id,
              measurementDescription: orderData.apiResponse.measurment,
              referenceNo: measurementId,
              paymentTerms: "80-20",
              grossAmount: grossAmount.toString(),
              discount: discountAmount.toString(),
              totalAmount: totalAmount.toString(),
              orderType: "Platform",
              items: apiItems,
              comments: orderData.apiResponse.comments,
              invoiceType: orderData.apiResponse.type.toString(),
              estimatedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };

            // Build FormData
            const formData = new FormData();
            Object.entries(orderPayload).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                if (key === 'items' && Array.isArray(value)) {
                  value.forEach((item: any, index: number) => {
                    Object.entries(item).forEach(([itemKey, itemValue]) => {
                      formData.append(`items[${index}][${itemKey}]`, String(itemValue ?? ''));
                    });
                  });
                } else if (key === 'fullModelData' && Array.isArray(value)) {
                  formData.append('fullModelData', JSON.stringify(value));
                } else if (typeof value === 'object' && !Array.isArray(value)) {
                  Object.entries(value).forEach(([subKey, subValue]) => {
                    formData.append(`${key}[${subKey}]`, String(subValue ?? ''));
                  });
                } else {
                  formData.append(key, String(value));
                }
              }
            });

            // Attach files
            screenshotFiles.forEach((file) => {
              formData.append('files', file);
            });

            // Create order
            const invoiceResult = await axios.post(
              CREATE_ORDER,
              formData
            );

            if (invoiceResult.status === 201) {
              const responseData = invoiceResult.data;
              
              // ✅ Extract invoice number - check invoiceNumber field FIRST (most specific)
              let extractedInvoiceNumber = responseData?.invoiceNumber || 
                             responseData?.invoice_number ||
                             null;
              
              // If not found, recursively search for invoice number in response
              if (!extractedInvoiceNumber) {
                const findInvoiceNumber = (obj: any, path = ''): string | null => {
                  if (!obj || typeof obj !== 'object') return null;
                  for (const [key, value] of Object.entries(obj)) {
                    const fullPath = path ? `${path}.${key}` : key;
                    // ✅ Check for invoiceNumber specifically (not invoiceDate!)
                    if (key === 'invoiceNumber' || key === 'invoice_number') {
                      if (typeof value === 'string' && value !== measurementId && !/^[0-9a-fA-F]{24}$/.test(value)) {
                        return value;
                      }
                    }
                    // Recursively check nested objects
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                      const result = findInvoiceNumber(value, fullPath);
                      if (result) return result;
                    }
                  }
                  return null;
                };
                
                extractedInvoiceNumber = findInvoiceNumber(responseData);
              }
              
              // If not found, try to fetch order details
              if (!extractedInvoiceNumber) {
                const orderId = responseData?._id || responseData?.id;
                if (orderId && orderId !== measurementId) {
                  try {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const orderDetailResponse = await axios.get(GET_ORDER(orderId));
                    const orderDetail = orderDetailResponse.data;
                    
                    // Check invoiceNumber field directly
                    extractedInvoiceNumber = orderDetail?.invoiceNumber || 
                                           orderDetail?.invoice_number ||
                                           orderId; // Use order ID as fallback
                  } catch (fetchError: any) {
                    extractedInvoiceNumber = orderId; // Use order ID as fallback
                  }
                }
              }

              if (extractedInvoiceNumber && extractedInvoiceNumber !== measurementId) {
                const orderMongoId = responseData?._id || responseData?.id;
                
                // ✅ Update local state immediately for reactive UI update
                setInvoiceNumber(extractedInvoiceNumber);
                
                // Update orderData with invoice number AND order MongoDB ID
                // invoiceNumber is for display, orderMongoId is for API calls
                const updatedOrderData = {
                  ...orderData,
                  orderInfo: {
                    ...orderData.orderInfo,
                    orderId: extractedInvoiceNumber, // For display
                    orderMongoId: orderMongoId, // For API calls (charge creation)
                  }
                };
                
                // Update store and storage
                const { setOrderData } = useOrderStore.getState();
                setOrderData(updatedOrderData);
                setStorageItem('fullOrderData', updatedOrderData, true);
              }
            }
          } catch (error: any) {
            console.error('Error creating order on Terms page:', error);
            orderCreationAttempted.current = false; // Reset to allow retry
          }
        } else {
          // If order already has invoice number, set it in state
          if (currentOrderId !== measurementId) {
            setInvoiceNumber(currentOrderId);
          }
        }
      }
    };

    // Only run if we have orderData with apiResponse
    if (orderData && orderData.apiResponse && orderData.apiResponse.lineItems) {
      createOrderIfNeeded();
    }
  }, [orderData]);


  // Add direct storage listener for price updates
  useEffect(() => {
    // Function to check for updated price data
    const checkPriceUpdates = () => {
      try {
        const freshPriceData = getStorageItem('currentPriceData', null);
        if (freshPriceData) {
          calculateTotal();
        }
      } catch (error) {
        console.error('Error checking for price updates:', error);
      }
    };

    // Create an event listener for storage changes
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'currentPriceData' || event.key === 'fullOrderData') {
        checkPriceUpdates();
      }
    };

    // Listen for storage events (when another tab/component updates storage)
    window.addEventListener('storage', handleStorageChange);
    
    // Also set up a more efficient interval (every 3 seconds instead of 2)
    const interval = setInterval(checkPriceUpdates, 3000);
    
    // Initial check
    checkPriceUpdates();
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  /**
   * Calculate the total based on the most up-to-date price data
   * Prioritizing computed price if available
   */
  const calculateTotal = () => {
    // First try to get fresh price data using our cross-platform storage utility
    let computedTotal = 0;
    try {
      const parsedPriceData = getStorageItem<{ Total?: number }>('currentPriceData', {});
      if (parsedPriceData && typeof parsedPriceData === 'object') {
        // Convert to number and handle null/undefined
        const totalValue = parsedPriceData?.Total;
        computedTotal = typeof totalValue === 'number' ? totalValue : 
                       typeof totalValue === 'string' ? parseFloat(totalValue) || 0 : 0;
      }
    } catch (e) {
      console.error('Error reading price data from storage:', e);
    }

    // If no session data, check orderData
    if (computedTotal === 0 && orderData?.computedPrice?.Total) {
      computedTotal = orderData.computedPrice.Total;
    }

    // If still no computed price, fall back to line items
    const apiItems = orderData?.apiResponse?.lineItems || [];
    const baseTotal = apiItems.reduce((sum: number, it: { price: string | number }) => sum + toNum(it.price), 0);
    
    // Use the best available price source
    const totalBeforeDiscount = computedTotal > 0 ? computedTotal : baseTotal;
    
    const discounted = totalBeforeDiscount - (totalBeforeDiscount * toNum(discountCode.discount)) / 100;
    const finalTotal = expressService ? discounted * 1.25 : discounted;
    setTotalPrice(finalTotal);
  };

  const formatDate = (dateString: string | undefined) => {
    const dates = [
      dateString,
      orderData?.apiResponse?.createdAt,
      orderData?.orderInfo?.orderDate,
    ];

    for (const date of dates) {
      if (date && date !== 'N/A') {
        try {
          const parsedDate = new Date(date);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toLocaleDateString('en-US', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric'
            });
          }
        } catch (error) {
          console.error('Error parsing date:', date);
        }
      }
    }
    return "N/A";
  };

  const terms = [
    {
      title: t('term_payment', '1. Payment Terms'),
      content: [
        t('term_payment_1', '80% Payment: Customers are required to pay 80% of the total price through the system upon finalizing their design and proceeding to payment.'),
        t('term_payment_2', '20% Payment: The remaining 20% must be paid on the delivery day before final handover.')
      ]
    },
    {
      title: t('term_cancellation', '2. Cancellations and Refunds'),
      content: [
        t('term_cancellation_1', 'Cancellations are not allowed after payment has been processed due to the immediate purchase of materials.'),
        t('term_cancellation_2', 'Customers must confirm their designs and materials before proceeding to payment to avoid errors.'),
        t('term_cancellation_3', 'Refunds will not be issued once payment has been made.')
      ]
    },
    {
      title: t('term_changes', '3. Changes and Additions'),
      content: [
        t('term_changes_1', 'Any additional items or design changes requested after the initial confirmation will be handled separately through customer service.'),
        t('term_changes_2', 'Additional costs incurred due to changes will be communicated and must be approved by the customer before proceeding.')
      ]
    },
    {
      title: t('term_materials', '4. Materials and Stock Availability'),
      content: [
        t('term_materials_1', 'DAR reserves the right to inform customers if selected materials are unavailable due to supplier constraints or stock issues.'),
        t('term_materials_2', 'In such cases, customers will be contacted promptly, and alternative options will be provided for approval before production.')
      ]
    },
    {
      title: t('term_timeline', '5. Project Timeline'),
      content: [
        t('term_timeline_1', 'Estimated timelines for design, production, and delivery will be provided upon payment.'),
        t('term_timeline_2', 'Delays caused by unforeseen circumstances, including supplier issues or logistics, will be communicated to customers promptly.')
      ]
    },
    {
      title: t('term_liability', '6. Liability'),
      content: [
        t('term_liability_1', 'DAR is committed to delivering high-quality designs and materials. However, DAR is not liable for damages caused by:'),
        t('term_liability_2', 'Misuse or improper handling of delivered items.'),
        t('term_liability_3', 'Delays caused by events outside DAR\'s control (e.g., natural disasters, supplier delays).')
      ]
    },
    {
      title: t('term_jurisdiction', '7. Legal Jurisdiction'),
      content: [
        t('term_jurisdiction_1', 'These terms and conditions are governed by the laws of the State of Kuwait.'),
        t('term_jurisdiction_2', 'Any disputes arising from these terms will be resolved in Kuwait courts.')
      ]
    },
    {
      title: t('term_contract', '8. Physical Contract'),
      content: [
        t('term_contract_1', 'A physical contract containing these terms will be sent to customers after payment.'),
        t('term_contract_2', 'Customers must sign and return the contract before production begins.')
      ]
    },
    {
      title: t('term_responsibilities', '9. Customer Responsibilities'),
      content: [
        t('term_responsibilities_1', 'Customers are responsible for ensuring that the dimensions and materials selected during the design process meet their requirements.'),
        t('term_responsibilities_2', 'Customers are required to review their final design thoroughly before proceeding to payment.')
      ]
    },
    {
      title: t('term_express', '10. DAR Express Service (Optional)'),
      content: [
        t('term_express_1', 'Customers can opt for DAR Express Service for expedited production and delivery at an additional cost of 25% of the total price.')
      ]
    }
  ];

  const ApplyDiscount = (name: string | null) => {
    if (name) {
      setIsLoading(true);
      axios
        .get(GET_DISCOUNT_CODE(name))
        .then((res) => {
          setDiscountCode(res.data);
          setIsLoading(false);
          alert("Discount has been applied successfully");
        })
        .catch(() => {
          setIsLoading(false);
          alert("Invalid Discount Code");
        });
    } else {
      setDiscountCode({ name: "", discount: 0 });
      calculateTotal();
    }
  };

  // Base64 → File
  const base64ToFile = (base64: string, filename: string): File => {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const handleProceed = async () => {
    if (!isAgreed) return;

    try {
      setIsLoading(true);

      // Build the item list from API response (this is what backend expects)
      const apiItems = (orderData?.apiResponse?.lineItems || []).map((item: any) => ({
        itemId: item._id,
        item: item.name,
        description: item.description,
        quantity: "1",
        price: toNum(item.price).toString(),
        amount: toNum(item.price).toString(),
        status: "PENDING"
      }));

      // Totals from the SAME source (apiItems) + express fee if enabled
      const itemsTotal = apiItems.reduce((sum: number, item: any) => sum + toNum(item.price), 0);
      const discountAmount = (itemsTotal * toNum(discountCode.discount)) / 100;
      const discounted = itemsTotal - discountAmount;
      const expressFee = expressService ? discounted * 0.25 : 0;

      const grossAmount = itemsTotal; // before discounts
  
      
      // Append DAR Express Service as a separate item (if selected)
      const itemsForPayload = expressService
        ? [
            ...apiItems,
            {
              itemId: "68348e638d6d4aa7da291203",
              item: "DAR Express Service",
              description: "Expedited production and delivery (+25%)",
              quantity: "1",
              price: expressFee.toString(),
              amount: expressFee.toString(),
              status: "PENDING"
            }
          ]
        : apiItems;

      // Screenshots → Files
      const screenshotFiles: File[] = [];
      
      // Check if screenshots were omitted due to storage quota issues
      const screenshotsOmitted = getStorageItem('screenshotsOmitted', false);
      const minimalDataOnly = getStorageItem('minimalDataOnly', false);
      
      if (screenshotsOmitted || minimalDataOnly) {
        // Optionally show a warning to the user
        // toast.info(t('design_preview_unavailable', 'Design previews are not available due to browser storage limitations'));
      }
      
      // Only process screenshots if they exist
      try {
        if (orderData?.designScreenshots?.back) {
          screenshotFiles.push(base64ToFile(orderData.designScreenshots.back, 'design-back-view.jpg'));
        }
        if (orderData?.designScreenshots?.front) {
          screenshotFiles.push(base64ToFile(orderData.designScreenshots.front, 'design-front-view.jpg'));
        }
        if (orderData?.designScreenshots?.left) {
          screenshotFiles.push(base64ToFile(orderData.designScreenshots.left, 'design-left-view.jpg'));
        }
        if (orderData?.designScreenshots?.right) {
          screenshotFiles.push(base64ToFile(orderData.designScreenshots.right, 'design-right-view.jpg'));
        }
      } catch (error) {
        console.error('Error processing screenshots:', error);
        // Continue without screenshots
      }

      // ✅ Invoice number is already generated when Terms page loaded
      // Use the invoiceNumber state if available, otherwise use orderData.orderInfo.orderId
      const currentInvoiceNumber = invoiceNumber || orderData.orderInfo.orderId;
      
      // ✅ Get the order MongoDB ID for API calls (charge creation needs the MongoDB _id, not invoice number)
      // Check if orderMongoId is stored, otherwise check if orderId is a MongoDB ObjectId
      let orderMongoId = (orderData.orderInfo as any)?.orderMongoId;
      
      if (!orderMongoId) {
        // If orderMongoId not set, check if orderId is a MongoDB ObjectId (24 hex chars)
        const orderId = orderData.orderInfo.orderId;
        if (orderId && /^[0-9a-fA-F]{24}$/.test(orderId)) {
          // orderId is a MongoDB ObjectId, use it
          orderMongoId = orderId;
        } else {
          // orderId is an invoice number string, use the measurement ID as fallback
          orderMongoId = orderData.apiResponse._id;
        }
      }

      // ✅ Update the order if discounts or express service were applied
      // Build order update payload (if discounts/express service changed)
      const orderUpdatePayload: any = {
        invoiceDate: formatDateToISO(orderData.orderInfo.orderDate),
        status: "SAVED",
        userType: "Customer",
        customerId: orderData.apiResponse.customerId,
        measurementId: orderData.apiResponse._id,
        measurementDescription: orderData.apiResponse.measurment,
        referenceNo: currentInvoiceNumber, // Use the existing invoice number
        paymentTerms: "80-20",
        grossAmount: grossAmount.toString(),
        discount: discountAmount.toString(),
        totalAmount: totalPrice.toString(),
        orderType: "Platform",
        items: itemsForPayload,
        comments: orderData.apiResponse.comments,
        invoiceType: orderData.apiResponse.type.toString(),
        estimatedDeliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // ✅ Update the order with new totals (if discounts/express service applied)
      try {
        // Try to update the existing order if invoice number exists and is not a measurement ID
        const isInvoiceNumber = currentInvoiceNumber && currentInvoiceNumber !== orderData.apiResponse._id;
        
        if (isInvoiceNumber) {
          // Build FormData for update
          const updateFormData = new FormData();
          Object.entries(orderUpdatePayload).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (key === 'items' && Array.isArray(value)) {
                value.forEach((item: any, index: number) => {
                  Object.entries(item).forEach(([itemKey, itemValue]) => {
                    updateFormData.append(`items[${index}][${itemKey}]`, String(itemValue ?? ''));
                  });
                });
              } else if (typeof value === 'object' && !Array.isArray(value)) {
                Object.entries(value).forEach(([subKey, subValue]) => {
                  updateFormData.append(`${key}[${subKey}]`, String(subValue ?? ''));
                });
              } else {
                updateFormData.append(key, String(value));
              }
            }
          });

          // Attach files
          screenshotFiles.forEach((file) => {
            updateFormData.append('files', file);
          });

          // Update the order (optional - only if order supports updates)
          // Note: This might not be necessary if backend handles updates automatically
        }
      } catch (error) {
        // Order update failed, continue with charge creation
      }

      // ✅ Create charge payload using the existing invoice number
      const initialPaymentPercentage = 0.8; // 80% initial payment
      const initialPaymentAmount = totalPrice * initialPaymentPercentage;
    
      const chargePayload = {
        amount: Number(initialPaymentAmount.toFixed(3)),
        customerId: orderData.apiResponse.customerId,
        designId: orderData.designDetails.designId,
        orderId: orderMongoId, // ✅ Use the order MongoDB _id (API expects this, not invoice number string)
        invoiceType: orderData.apiResponse.type.toString(),
      };

      // ✅ Create charge with existing invoice number
      const chargeResponse = await axios.post(
        CREATE_INVOICE_CHARGE,
        chargePayload
      );

      const { deleteDraft } = useDraftStore.getState();
      await deleteDraft(orderData.apiResponse.customerId);

      window.location.href = chargeResponse.data.transaction.url;
      alert(`Invoice #${currentInvoiceNumber} has been sent to you by SMS`);
    } catch (error) {
      console.error("Error in handlePayment:", error);
      alert("An error occurred while processing the payment");
    } finally {
      setIsLoading(false);
    }
  };

  const renderOrderSummaryContent = () => (
    <>
      <DesignPreview
        screenshotUrl={orderData?.designScreenshots?.back}
        onImageClick={(imageUrl) => {
          setLightboxImage(imageUrl);
          setShowLightbox(true);
        }}
      />

      {/* Add missing mobile pieces */}
      <OrderInformation orderInfo={displayOrderInfo || orderData?.orderInfo} />

      <CustomerInformation customerInfo={orderData?.customerInfo} />

      <DesignDetails
        actualDesignId={actualDesignId}
        designData={designData}
        orderData={orderData}
        formatDate={formatDate}
      />

      <Accordion className="mb-4">
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            {t('ordered_items', 'Ordered Items')} ({lineItems?.length || 0})
          </Accordion.Header>
          <Accordion.Body className="p-4">
            <OrderedItems
              lineItems={lineItems}
              orderData={orderData}
            />
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <PriceSummary
        totalPrice={totalPrice}
        discountCode={discountCode}
        setDiscountCode={setDiscountCode}
        ApplyDiscount={ApplyDiscount}
        orderData={orderData}
        expressService={expressService}
        setExpressService={setExpressService}
      />
    </>
  );

  const renderTermsContent = () => (
    <>
      <Accordion className="mb-4">
        {terms.map((section, index) => (
          <Accordion.Item eventKey={index.toString()} key={index}>
            <Accordion.Header>
              {section.title}
            </Accordion.Header>
            <Accordion.Body>
              <ul className="ps-3 mb-0">
                {section.content.map((point, idx) => (
                  <li key={idx} className="mb-2">{point}</li>
                ))}
              </ul>
            </Accordion.Body>
          </Accordion.Item>
        ))}
      </Accordion>

      <div className="mt-4 pt-3 border-top">
        <div 
          className={`terms-checkbox-wrapper ${isAgreed ? 'agreed' : ''}`}
          data-status={t('pending_acceptance', 'Pending acceptance')}>

          <Form.Check
            type="checkbox"
            id="terms-checkbox"
            className="mb-3"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
            label={<span className="fw-bold">{t('agree_to_terms', 'I agree to the Terms and Conditions')}</span>}
          />
        </div>
      </div>
    </>
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="terms-wrapper w-100">
      {/* Back Button */}
      <div className="mb-3 backbtn">
        <button
          className="btn btn-outline-primary"
          onClick={() => {
            // If user has scrolled but not agreed to terms, show reminder
            if (hasScrolled && termsProgress > 30 && !isAgreed) {
              setShowReminderModal(true);
            } else {
              // Otherwise proceed with navigation
              const userId = searchParams.get("userid") || orderData?.apiResponse?.customerId;
              window.location.href = `/?userid=${userId}`;
            }
          }}
        >
          Back
        </button>
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      )}

      <Container fluid className="p-0 px-md-4 py-3 py-md-5 container-terms">
        {/* Mobile View - Main Accordion */}
        <div className="d-lg-none mb-4">
          <Accordion defaultActiveKey="summary" alwaysOpen>
            <Accordion.Item eventKey="summary">
              <Accordion.Header className="main-accordion-header">
                <h4 className="mb-0 fs-5">{t('order_summary', 'Order Summary')}</h4>
              </Accordion.Header>
              <Accordion.Body>
                {renderOrderSummaryContent()}
              </Accordion.Body>
            </Accordion.Item>

            <Accordion.Item eventKey="terms">
              <Accordion.Header className="main-accordion-header">
                <h4 className="mb-0 fs-5">{t('terms_and_conditions', 'Terms and Conditions')}</h4>
              </Accordion.Header>
              <Accordion.Body>
                {renderTermsContent()}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </div>

        {/* Desktop View - Side-by-side Cards */}
        <Row className="mx-0 w-100 justify-content-center d-none d-lg-flex">
          {/* Order Summary */}
          <Col lg={4} className="mb-4 px-md-3">
            <Card className="shadow-sm border-0 terms-card">
              <Card.Header className="bg-primary text-white py-3">
                <h4 className="mb-0">{t('order_summary', 'Order Summary')}</h4>
              </Card.Header>
              <Card.Body className="d-flex flex-column order-body">
                <DesignPreview
                  screenshotUrl={orderData?.designScreenshots?.back}
                  onImageClick={(imageUrl) => {
                    setLightboxImage(imageUrl);
                    setShowLightbox(true);
                  }}
                  className="col-12 mb-3"
                />

                <OrderInformation orderInfo={displayOrderInfo || orderData?.orderInfo} />

                <CustomerInformation customerInfo={orderData?.customerInfo} />

                <DesignDetails
                  actualDesignId={actualDesignId}
                  designData={designData}
                  orderData={orderData}
                  formatDate={formatDate}
                />

                <OrderedItems
                  lineItems={lineItems}
                  orderData={orderData}
                />

                <PriceSummary
                  totalPrice={totalPrice}
                  discountCode={discountCode}
                  setDiscountCode={setDiscountCode}
                  ApplyDiscount={ApplyDiscount}
                  orderData={orderData}
                  expressService={expressService}
                  setExpressService={setExpressService}
                />
              </Card.Body>
            </Card>
          </Col>

          <Col lg={8} className="px-md-3">
            <Card className="shadow-sm border-0 terms-card">
              <Card.Header className="bg-primary text-white py-3">
                <h4 className="mb-0">{t('terms_and_conditions', 'Terms and Conditions')}</h4>
              </Card.Header>
              <Card.Body className="terms-card-body">
                <div className="terms-progress-container mb-3">
                  <div className="terms-progress-heading">
                    <i className="fas fa-clipboard-check"></i>
                    {t('terms_progress', 'Your Progress')}
                  </div>
                  <div className="terms-progress-bar">
                    <div className="terms-progress-fill" style={{ width: `${termsProgress}%` }}></div>
                  </div>
                  <div className="terms-progress-steps">
                    <div className={`terms-progress-step ${hasScrolled ? 'completed' : 'active'}`}>
                      <span>{t('read_terms', 'Read Terms')}</span>
                    </div>
                    <div className={`terms-progress-step ${hasScrolled && termsProgress >= 50 ? 'completed' : (hasScrolled ? 'active' : '')}`}>
                      <span>{t('review_details', 'Review Details')}</span>
                    </div>
                    <div className={`terms-progress-step ${isAgreed ? 'completed' : (termsProgress >= 80 ? 'active' : '')}`}>
                      <span>{t('accept_terms', 'Accept & Continue')}</span>
                    </div>
                  </div>
                </div>
                <div 
                  className="terms-scroll-container"
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const scrollPercentage = (container.scrollTop / (container.scrollHeight - container.clientHeight)) * 100;
                    setTermsProgress(Math.min(Math.round(scrollPercentage), 100));
                    
                    if (!hasScrolled && scrollPercentage > 10) {
                      setHasScrolled(true);
                    }
                    
                    // Highlight important sections as user scrolls
                    // Only highlight if user hasn't agreed yet to draw attention
                    if (!isAgreed) {
                      // Find important sections (indexes 0, 1, and 8)
                      const importantSectionIndexes = [0, 1, 8]; 
                      
                      // Check if we should highlight a section based on scroll position
                      // This randomly highlights sections as user scrolls to draw attention
                      if (scrollPercentage > 30 && Math.random() > 0.7) {
                        // Randomly pick one of the important sections
                        const randomIndex = importantSectionIndexes[Math.floor(Math.random() * importantSectionIndexes.length)];
                        
                        if (highlightedSection !== randomIndex) {
                          // Set the new highlighted section
                          setHighlightedSection(randomIndex);
                          
                          // Remove highlight after a delay
                          setTimeout(() => {
                            setHighlightedSection(null);
                          }, 2000);
                        }
                      }
                    }
                  }}>
                  {terms.map((section, index) => {
                    // Highlight important sections for Payment Terms and Cancellations
                    const isImportantSection = index === 0 || index === 1 || index === 8;
                    const isCurrentlyHighlighted = highlightedSection === index;
                    return (
                      <div key={index} className={`mb-4 ${isImportantSection ? 'terms-important-section' : ''} ${isCurrentlyHighlighted ? 'highlight' : ''}`}>
                        <h5 className="fw-bold text-primary">{section.title}</h5>
                        <ul className="ps-3">
                          {section.content.map((point, idx) => (
                            <li key={idx} className="mb-2">{point}</li>
                          ))}
                        </ul>
                        {isImportantSection && (
                          <div className="mt-2 small text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            {t('important_section', 'This section is especially important. Please review carefully.')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 pt-3 border-top">
                  <div 
                    className={`terms-checkbox-wrapper ${isAgreed ? 'agreed' : ''}`}
                    data-status={t('pending_acceptance', 'Pending acceptance')}>
                    <Form.Check
                      type="checkbox"
                      id="terms-checkbox-desktop"
                      className="mb-3"
                      checked={isAgreed}
                      onChange={(e) => setIsAgreed(e.target.checked)}
                      label={<span className="fw-bold">{t('agree_to_terms', 'I agree to the Terms and Conditions')}</span>}
                    />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Removed Floating Accept Button */}
      
      {/* Terms Reminder Modal */}
      {showReminderModal && (
        <div className="terms-reminder-modal" onClick={() => setShowReminderModal(false)}>
          <div className="terms-reminder-content" onClick={(e) => e.stopPropagation()}>
            <div className="terms-reminder-header">
              <i className="fas fa-exclamation-triangle"></i>
              <h4>{t('reminder_title', 'Wait! You haven\'t agreed to terms yet')}</h4>
            </div>
            <p>
              {t('reminder_message', 'It looks like you\'ve been reviewing our terms but haven\'t agreed to them yet. To continue with your purchase, please agree to the terms and conditions.')}
            </p>
            <div className="terms-reminder-buttons">
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  const userId = searchParams.get("userid") || orderData?.apiResponse?.customerId;
                  window.location.href = `/?userid=${userId}`;
                }}
              >
                {t('leave_anyway', 'Leave Anyway')}
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowReminderModal(false)}
              >
                {t('continue_reviewing', 'Continue Reviewing')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {showLightbox && (
        <div className="lightbox-overlay" onClick={() => setShowLightbox(false)}>
          <button
            className="lightbox-close"
            onClick={() => setShowLightbox(false)}
            aria-label="Close"
          >
            ×
          </button>
          <img
            src={lightboxImage}
            alt="Design Preview - Enlarged"
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          className="scroll-top-btn"
          onClick={scrollToTop}
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m18 15-6-6-6 6" />
          </svg>
        </button>
      )}

      {/* Hint to agree to terms when scrolled enough but not agreed yet */}
      <div className={`terms-agreement-hint ${(termsProgress > 50 && !isAgreed) ? 'visible' : ''}`}>
        <i className="fas fa-info-circle me-2"></i>
        {t('terms_hint', 'Please agree to the terms and conditions to proceed')}
      </div>

      {/* Sticky proceed button */}
      <div className={`sticky-proceed-container ${isAgreed ? 'payment-ready' : ''}`}>
        <Container>
          <div className="d-flex align-items-center sticky-proceed-content">
            <div className="me-3">
              <div className="fw-bold">{totalPrice.toFixed(2)} KD</div>
              <div className="small text-white-50">{t('initial_payment')}: {(totalPrice * 0.8).toFixed(2)} KD</div>
            </div>
            <button
              onClick={handleProceed}
              disabled={!isAgreed}
              className={`btn flex-grow-1 ${isAgreed ? 'btn-light payment-button-enabled' : 'btn-light opacity-50'}`}
              aria-label={isAgreed ? t('ready_to_proceed', 'Ready to proceed to payment') : t('agree_to_terms_first', 'Please agree to terms first')}
            >
              {isAgreed ? (
                <>
                  <i className="fas fa-check-circle me-2"></i>
                  {t('proceed_to_payment')}
                </>
              ) : (
                t('proceed_to_payment')
              )}
            </button>
          </div>
        </Container>
      </div>
    </div>
  );
}

export default Terms;
