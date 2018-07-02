const maciejKeys = {
  aNd401dAPp: true,
};

module.exports = (appkey) => {
  if (maciejKeys[appkey]) {
    return true;
  } else {
    return false;
  }
};
