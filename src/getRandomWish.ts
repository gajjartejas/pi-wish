export const getRandomWish = (): string => {
  const wishes = ['Happy Birthday!', 'Happy Birthday 🎉', 'Happy Birthday 🙂'];

  return wishes[Math.floor(Math.random() * wishes.length)];
};
