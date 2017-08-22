import opn from 'opn';
import { generatePortNumber, getHostName } from '../utils';


function open(path) {
  let url = getHostName(generatePortNumber());
  if (typeof path === 'string') {
    url += path;
  }
  opn(url);
}

export default open;