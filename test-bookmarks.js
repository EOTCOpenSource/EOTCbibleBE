const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
let authToken = '';

async function testBookmarks() {
    try {
        console.log('🚀 Starting Bookmark API Tests...\n');

        // Step 1: Register a user
        console.log('1. Registering user...');
        const registerResponse = await axios.post(`${BASE_URL}/api/v1/auth/register`, {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
        console.log('✅ User registered successfully');
        authToken = registerResponse.data.data.token;
        console.log(`Token: ${authToken.substring(0, 20)}...\n`);

        // Step 2: Test creating bookmark with valid data
        console.log('2. Testing bookmark creation with valid data...');
        const createResponse = await axios.post(`${BASE_URL}/api/v1/bookmarks`, {
            bookId: 'genesis',
            chapter: 1,
            verseStart: 1,
            verseCount: 5
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Bookmark created successfully');
        console.log('Response:', JSON.stringify(createResponse.data, null, 2));
        const bookmarkId = createResponse.data.data.bookmark._id;
        console.log(`Bookmark ID: ${bookmarkId}\n`);

        // Step 3: Test creating bookmark with invalid verseStart
        console.log('3. Testing bookmark creation with invalid verseStart (0)...');
        try {
            await axios.post(`${BASE_URL}/api/v1/bookmarks`, {
                bookId: 'genesis',
                chapter: 1,
                verseStart: 0,
                verseCount: 5
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Expected error but got success');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected invalid verseStart');
                console.log('Error message:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        console.log();

        // Step 4: Test creating bookmark with invalid verseCount
        console.log('4. Testing bookmark creation with invalid verseCount (0)...');
        try {
            await axios.post(`${BASE_URL}/api/v1/bookmarks`, {
                bookId: 'genesis',
                chapter: 1,
                verseStart: 1,
                verseCount: 0
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Expected error but got success');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected invalid verseCount');
                console.log('Error message:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        console.log();

        // Step 5: Test creating bookmark with missing fields
        console.log('5. Testing bookmark creation with missing verseStart...');
        try {
            await axios.post(`${BASE_URL}/api/v1/bookmarks`, {
                bookId: 'genesis',
                chapter: 1,
                verseCount: 5
            }, {
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('❌ Expected error but got success');
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('✅ Correctly rejected missing verseStart');
                console.log('Error message:', error.response.data.message);
            } else {
                console.log('❌ Unexpected error:', error.message);
            }
        }
        console.log();

        // Step 6: Test getting all bookmarks
        console.log('6. Testing get all bookmarks...');
        const getAllResponse = await axios.get(`${BASE_URL}/api/v1/bookmarks`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ Retrieved all bookmarks');
        console.log('Response:', JSON.stringify(getAllResponse.data, null, 2));
        console.log();

        // Step 7: Test getting specific bookmark
        console.log('7. Testing get bookmark by ID...');
        const getByIdResponse = await axios.get(`${BASE_URL}/api/v1/bookmarks/${bookmarkId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ Retrieved bookmark by ID');
        console.log('Response:', JSON.stringify(getByIdResponse.data, null, 2));
        console.log();

        // Step 8: Test updating bookmark
        console.log('8. Testing update bookmark...');
        const updateResponse = await axios.put(`${BASE_URL}/api/v1/bookmarks/${bookmarkId}`, {
            verseCount: 7
        }, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('✅ Updated bookmark');
        console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
        console.log();

        // Step 9: Test deleting bookmark
        console.log('9. Testing delete bookmark...');
        const deleteResponse = await axios.delete(`${BASE_URL}/api/v1/bookmarks/${bookmarkId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ Deleted bookmark');
        console.log('Response:', JSON.stringify(deleteResponse.data, null, 2));
        console.log();

        // Step 10: Verify bookmark is deleted
        console.log('10. Verifying bookmark is deleted...');
        const finalGetResponse = await axios.get(`${BASE_URL}/api/v1/bookmarks`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        console.log('✅ Final bookmark count:', finalGetResponse.data.data.count);
        console.log();

        console.log('🎉 All tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the tests
testBookmarks();
