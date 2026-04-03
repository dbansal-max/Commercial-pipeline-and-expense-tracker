const http = require('http');

const testRolesAPI = async () => {
  try {
    console.log('🔍 Testing /api/roles endpoint...');

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc3NTE1MDYxMywiZXhwIjoxNzc1NzU1NDEzfQ.MlmZfeHz-uokeA2WTbiXB-d7N9riNgrbA9vRZXMqtiE';

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/roles',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('✅ Response received:');
        console.log('📊 Status:', res.statusCode);
        console.log('📄 Data:', data);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
    });

    req.end();

  } catch (error) {
    console.error('❌ Error testing roles API:', error.message);
  }
};

testRolesAPI();
