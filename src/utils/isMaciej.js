const maciejKeys = {
  aNd401dAPp: true,
};

module.exports = {
  isMaciej: (appkey) => {
    if (maciejKeys[appkey]) {
      return true;
    } else {
      return false;
    }
  },
};
