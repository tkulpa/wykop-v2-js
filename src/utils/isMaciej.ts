const maciejKeys = {
  aNd401dAPp: true,
};

export default (appkey) => {
  if (maciejKeys[appkey]) {
    return true;
  } else {
    return false;
  }
};
