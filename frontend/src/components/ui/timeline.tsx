import { useEffect, useRef, useState } from "react";

interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

export const Timeline = ({ data }: { data: TimelineEntry[] }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;

    const updateHeight = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setHeight(rect.height);
      }
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref]);

  return (
    <div className="w-full bg-background font-sans md:px-10">
      <div className="max-w-7xl mx-auto py-20 px-4 md:px-8 lg:px-10">
        <h2 className="text-lg md:text-4xl mb-4 text-foreground max-w-4xl">
          История обновлений
        </h2>
        <p className="text-muted-foreground text-sm md:text-base max-w-sm">
          Мы постоянно улучшаем нашу платформу. Вот список последних изменений.
        </p>
      </div>

      <div ref={ref} className="relative max-w-7xl mx-auto pb-20">
        {data.map((item, index) => (
          <div
            key={index}
            className="flex justify-start pt-10 md:pt-40 md:gap-10"
          >
            <div className="sticky flex flex-col md:flex-row z-40 items-center top-40 self-start max-w-xs lg:max-w-sm md:w-full">
              <div className="h-10 absolute left-3 md:left-3 w-10 rounded-full bg-background flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-muted-foreground/20 border border-muted-foreground/50 p-2" />
              </div>
              <h3 className="hidden md:block text-xl md:pl-20 md:text-5xl font-bold text-muted-foreground/50 ">
                {item.title}
              </h3>
            </div>

            <div className="relative pl-20 pr-4 md:pl-4 w-full">
              <h3 className="md:hidden block text-2xl mb-4 text-left font-bold text-muted-foreground/50">
                {item.title}
              </h3>
              <div>{item.content}</div>
            </div>
          </div>
        ))}

        {/* Соединительная полоса. Однотонный фон + градиентная заливка поверх,
            обе всегда полной высоты — никаких scroll-linked трюков.
            Mask мягко срезает 3% по краям, чтобы не упираться в pt-40/pb-20. */}
        <div
          style={{ height: height + "px" }}
          className="absolute md:left-8 left-8 top-0 overflow-hidden w-[2px] bg-muted-foreground/25 [mask-image:linear-gradient(to_bottom,transparent_0%,black_3%,black_97%,transparent_100%)]"
        >
          <div className="absolute inset-x-0 top-0 h-full w-[2px] bg-gradient-to-b from-purple-500 via-blue-500 to-purple-400 rounded-full" />
        </div>
      </div>
    </div>
  );
};
