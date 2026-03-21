//Own components
import { MapSection } from "../MapSection";
import { SearchBar } from "../shared/Searchbar/SearchBar";
import { ShowLocaleCards } from "./ShowLocaleCard";

export const LocaleSection = () => {
  return (
    <>
      <div>
        <SearchBar />
      </div>

      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-6">
            <div className="w-full lg:w-1/2">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 md:max-w-2xl md:mx-auto lg:max-w-none lg:mx-0">
                <ShowLocaleCards />
              </div>
            </div>

            <div className="w-full lg:w-1/2 lg:sticky lg:top-20">
              <MapSection />
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
