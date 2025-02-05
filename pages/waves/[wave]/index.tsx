import { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const { wave } = params as { wave: string }

  return {
    redirect: {
      destination: `/my-stream?wave=${wave}`,
      permanent: false,
    },
  }
}

export default function WaveRedirect() {
  return null
} 