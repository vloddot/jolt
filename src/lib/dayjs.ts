import dayjs from 'dayjs';
import calendar from 'dayjs/plugin/calendar';
import format from 'dayjs/plugin/localizedFormat';
import update from 'dayjs/plugin/updateLocale';

export default dayjs;

dayjs.extend(calendar);
dayjs.extend(format);
dayjs.extend(update);
