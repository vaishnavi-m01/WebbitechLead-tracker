const axios = require('axios');
axios.post('https://countriesnow.space/api/v0.1/countries/state/cities', { country: 'India', state: 'Tamil Nadu' })
  .then(r => console.log(r.data.data.slice(0,5)))
  .catch(e => console.log(e.message));
