import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase"; // Correct Path
import Reveal from "../components/Reveal";
import { ArrowRight, Clock } from "lucide-react";
import "./blog.css";

export default function Blog() {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchBlogs() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("blog_articles")
          .select("*")
          .order("published_at", { ascending: false });

        if (error) throw error;
        
        if (isMounted) {
          setPosts(data || []);
        }
      } catch (error) {
        console.error("Error fetching blog articles:", error.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchBlogs();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="page-top">
      <section
        className="section dot-grid"
        style={{ paddingTop: 40, paddingBottom: 60 }}
      >
        <div className="container text-center">
          <Reveal delay={100}>
            <span className="eyebrow">Insights</span>

            <h1
              style={{
                fontSize: "var(--step-5)",
                margin: "16px 0 24px",
              }}
            >
              InternNova Blog
            </h1>

            <p
              className="text-muted"
              style={{
                maxWidth: 600,
                margin: "0 auto",
                fontSize: "var(--step-1)",
              }}
            >
              Career advice, industry insights, engineering tutorials, and
              practical learning resources from the InternNova community.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="blog-grid">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="card blog-card blog-skeleton">
                  <div className="blog-card-img skeleton"></div>

                  <div className="blog-card-body">
                    <div className="skeleton skeleton-badge"></div>
                    <div className="skeleton skeleton-title"></div>
                    <div className="skeleton skeleton-line"></div>
                    <div className="skeleton skeleton-line short"></div>
                  </div>
                </div>
              ))
            ) : posts.length > 0 ? (
              posts.map((post, i) => (
                <Reveal key={post.id} delay={i * 100}>
                  <div className="card blog-card">
                    <div
                      className="blog-card-img"
                      style={{
                        backgroundImage: `url(${
                          post.image ||
                          "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                        })`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    ></div>

                    <div className="blog-card-body">
                      <div className="blog-meta">
                        <span className="badge badge-neutral">
                          {post.category || "General"}
                        </span>

                        <span className="blog-time">
                          <Clock size={14} />{" "}
                          {post.read_time
                            ? typeof post.read_time === "number" || !isNaN(post.read_time)
                              ? `${post.read_time} min read`
                              : post.read_time
                            : "3 min read"}
                        </span>
                      </div>

                      <h3>{post.title}</h3>

                      <p>{post.excerpt}</p>

                      <Link
                        to={`/blog/${post.slug || post.id}`}
                        className="blog-read-more"
                      >
                        Read Article <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))
            ) : (
              <Reveal>
                <div className="blog-empty">
                  <div className="blog-empty-icon">📚</div>

                  <h2>Knowledge Hub Coming Soon</h2>

                  <p>
                    We're preparing high-quality blogs, career guides,
                    engineering tutorials, interview preparation resources,
                    industry insights, and internship success stories.
                  </p>

                  <Link to="/internships" className="btn btn-primary">
                    Explore Internships
                  </Link>
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
