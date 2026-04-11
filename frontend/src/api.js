import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

export const fetchQuiz = () => client.get('/quiz').then((r) => r.data);

export const submitAnswers = (answers) =>
  client.post('/submit', { answers }).then((r) => r.data);

export const fetchResult = (id) => client.get(`/result/${id}`).then((r) => r.data);

export const fetchStats = () => client.get('/stats').then((r) => r.data);
