export const enumToOptions = (enumObj: any) => {
  return Object.values(enumObj).map(value => ({value: value as string, label: value as string}));
}
