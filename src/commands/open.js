import opn from 'opn';


function open(path, port) {
  let url = `http://127.0.0.1:${port}/`;
  if (typeof path === 'string') {
    url += path;
  }
  opn(url);
}

export default open;