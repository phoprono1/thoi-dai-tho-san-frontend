const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function run() {
  try {
    const baseURL = 'http://localhost:3005/api';
    const token = process.env.TEST_TOKEN || '';
    const api = axios.create({ baseURL });
    if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    const form = new FormData();
    form.append('file', fs.createReadStream('f:/Download/monsters-export.csv'));
    form.append('sync', 'true');

    const headers = form.getHeaders();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    console.log('DEBUG: baseURL=', baseURL);
    console.log('DEBUG: headers=', headers);

    const resp = await api.post('/admin/import/monsters', form, { headers, maxBodyLength: Infinity });
    console.log('status', resp.status);
    console.log('data', resp.data);
  } catch (e) {
    if (e.response) {
      console.error('response status', e.response.status);
      console.error('response data', e.response.data);
    } else {
      console.error('error', e.message);
    }
    process.exit(1);
  }
}

run();
