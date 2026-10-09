import { APP_TITLE, APP_TITLE_ML } from "../utils/constants.js";

export default function Header() {
  return (
    <header className="bg-green-800 text-white">
      <div className="mx-auto max-w-2xl px-4 pb-14 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-xl font-semibold leading-tight sm:text-2xl">{APP_TITLE}</h1>
        <p className="mt-1 font-malayalam text-lg font-medium text-green-100 sm:text-xl">
          {APP_TITLE_ML}
        </p>
      </div>
    </header>
  );
}
