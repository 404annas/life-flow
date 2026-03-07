import withPWA from 'next-pwa'

const withPwa = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      {
        source: '/kandban',
        destination: '/kanban',
        permanent: false,
      },
      {
        source: '/kanban-board',
        destination: '/kanban',
        permanent: false,
      },
      {
        source: '/kandban-board',
        destination: '/kanban',
        permanent: false,
      },
    ]
  },
}

export default withPwa(nextConfig)
