import { parseISO } from 'date-fns';
import { loadSelectedDate } from '../utils/storage';

const fallback = new Date();
const storedDate = loadSelectedDate();

export const defaultSelectedDate = storedDate ? parseISO(storedDate) : fallback;