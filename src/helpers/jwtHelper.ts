import { CapacitorCookies } from '@capacitor/core';
import {jwtDecode} from 'jwt-decode';

export async function getUserData() {
  try {
    
    const currentUrl = window.location.origin;
    const  cookies  = await CapacitorCookies.getCookies({ url: currentUrl });
    const token = cookies['jwt'];
    if (token) {
      try {
        const decoded = jwtDecode(token);
        return {decoded, token};
      } catch (error) {
        console.error("Invalid token:", error);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error("Error accessing", error);
    return null;
  } 
}


export async function getToken() {
  try {
    const currentUrl = window.location.origin;
    const  cookies  = await CapacitorCookies.getCookies({ url: currentUrl });
    console.log("Accessing cookies...", cookies);
    const token = cookies['jwt'];
    return token || null;
  } catch (error) {
    console.error("Error accessing cookies:", error);
    return null;
  }
}