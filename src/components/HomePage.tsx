
type HomePageProps = {
  loveDays: number
}

function HomePage({ loveDays }: HomePageProps) {
  return (
    <section className="home-page">
      <h1>❤️ 我们的小宇宙</h1>
      <p>这里收藏着属于我们的故事。</p>
      <p>我们已经在一起 {loveDays} 天</p>
    </section>
  )
}

export default HomePage
