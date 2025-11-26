
  //MasonryGrid.tsx

import { ReactNode } from "react";

interface MasonryGridProps {
  children: ReactNode;
}

const MasonryGrid = ({ children }: MasonryGridProps) => {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 px-4">
      {children}
    </div>
  );
};

export default MasonryGrid;
