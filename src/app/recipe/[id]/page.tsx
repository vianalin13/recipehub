type Params = {
  params: {id: string};
}

export default function Page({params}: Params) {
  return(
    <p>Recipe page for ID: {params.id}</p>
  )
}