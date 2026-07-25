const axios = require('axios');
axios.get('https://countriesnow.space/api/v0.1/countries/states')
  .then(r => {
    const india = r.data.data.find(c => c.name.toLowerCase() === 'india');
    console.log(india.states.map(s => s.name).slice(0, 15));
  })
  .catch(e => console.log(e.message));
