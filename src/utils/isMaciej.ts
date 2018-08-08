interface Keys {
  [key: string]: boolean;
}

const maciejKeys: Keys = {
  aNd401dAPp: true,
};

export default (appkey: string) => (!!maciejKeys[appkey]);
