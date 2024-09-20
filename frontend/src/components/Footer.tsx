import {FC} from 'react';

const Footer: FC<{}> = () => {
  return (
    <footer className="bg-gray-100">
      <div className="w-11/12 mx-auto py-4 md:flex md:items-center md:justify-between">
        <span className="text-sm text-gray-500 sm:text-center dark:text-gray-400">
          © 2024 <span>Top Coins</span>
        </span>
      </div>
    </footer>
  );
};

export default Footer;
