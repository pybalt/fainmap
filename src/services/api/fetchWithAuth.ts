/**
 * Base fetch function with common headers and error handling
 */
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Configure headers
  const headers = {
    ...options.headers,
    'Content-Type': 'application/json'
  };
  
  try {
    // Make request with credentials to send cookies
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    // Handle auth errors
    if (response.status === 401) {
      console.log('Authentication error, redirecting to login...');
      
      // Alert user
      alert('Your session has expired. Please log in again.');
      
      // Clear user data
      localStorage.removeItem('userLegajo');
      
      // Redirect to login
      window.location.href = '/';
    }
    
    return response;
  } catch (error) {
    console.error(`Error in fetchWithAuth for ${url}:`, error);
    throw error;
  }
};

export default fetchWithAuth; 