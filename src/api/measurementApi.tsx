import axios from "axios";
import { GET_MEASUREMENTS } from '../apiURL/endpoints';

export const getPaymentDetail = async (paymentPayload: any) => {
  try {
    const response = await axios.post(GET_MEASUREMENTS, paymentPayload, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
    return response.data;
  } catch (error) {
    console.error("Fetch error:", error);
    return;
  }
}

