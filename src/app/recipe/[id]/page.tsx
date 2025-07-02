interface PageProps {
  params: {
    id: string;
  };
}

export default function Page({params}: PageProps) {
  return <p>Recipe page for ID: {params.id}</p>
}