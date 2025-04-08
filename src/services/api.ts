import axios from 'axios';

export const apiBitCoin = axios.create({
  baseURL: 'https://rest.coincap.io/v3/assets/bitcoin',
  headers: {
    Accept: 'application/json',
    Authorization: 'Bearer 208315cb3e927adc5f2d32fc4f841961978dbe3941148f1f91d31a486ca79947'
  }
});






