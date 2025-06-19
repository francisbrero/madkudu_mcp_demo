import { type NextPage } from "next";

const Home: NextPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-[5rem]">
          MadKudu MCP Demo
        </h1>
        <p className="text-2xl text-white">
          Choose an agent to get started
        </p>
      </div>
    </main>
  );
};

export default Home;
