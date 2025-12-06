// Get CSRF token from cookie
export const getCsrfToken = (): string => {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : "";
};
