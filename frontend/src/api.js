import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/api`
  : '/api';

const client = axios.create({ baseURL });

export const fetchQuiz = () => client.get('/quiz').then((r) => r.data);
/** @param {Array|{ answers: Array, tiebreakers?: Array }} payload */
export const submitAnswers = (payload) => {
  const body = Array.isArray(payload) ? { answers: payload } : payload;
  return client.post('/submit', body).then((r) => r.data);
};
export const fetchResult = (id) =>
  client.get(`/result/${id}`).then((r) => r.data);
export const fetchStats = () => client.get('/stats').then((r) => r.data);

export const submitFeedback = (payload) =>
  client.post('/feedback', payload).then((r) => r.data);