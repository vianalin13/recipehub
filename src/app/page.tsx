import Image from "next/image";

export default function Home() {
  return(
    <div>
      <h1>Welcome to Recipe Hub</h1>
      <p>Your favorite recipes in one place</p>
      <Image
        src="/logo.svg"
        width={200}
        height={80}
        alt="Recipe Hub Logo"
      />
    </div>
  )
}