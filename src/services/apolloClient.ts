import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { showRateLimitNotification } from '../utils/notifications';
import Cookies from 'js-cookie';

const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL,
});

const authLink = setContext((_, { headers }) => {
  // Try to get token from cookies first, fallback to localStorage
  const token = Cookies.get('auth_token') || localStorage.getItem('token');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Error handling link for 429 rate limit errors and other errors
const errorLink = onError(({ graphQLErrors, networkError}) => {
  if (networkError) {
    const statusCode = (networkError as any).statusCode;
    
    // Handle 429 rate limit errors - show user notification
    if (statusCode === 429) {
      showRateLimitNotification();
      // Don't retry automatically to avoid making it worse
      return;
    }
  }

  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `GraphQL error: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
});

export const apolloClient = new ApolloClient({
  link: from([authLink, errorLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all', // Return partial results even if there are errors
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

