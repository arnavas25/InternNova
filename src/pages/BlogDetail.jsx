import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase"; // Correct Path
import { ArrowLeft, Clock } from "lucide-react";

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArticle() {
      try {
        setLoading(true);

        // 1. Slug se query karein
        let { data, error } = await supabase
          .from("blog_articles")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        // Check format for valid UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

        // 2. Agar slug me nahi mila aur ID valid UUID format me hai
        if (!data && isUuid) {
          const res = await supabase
            .from("blog_articles")
            .select("*")
            .eq("id", slug)
            .maybeSingle();

          data = res.data;
          error = res.error;
        }

        if (error) throw error;
        setPost(data);
      } catch (err) {
        console.error("Error loading blog:", err.message);
      } finally {
        setLoading(false);
      }
    }

    if (slug) fetchArticle();
  }, [slug]);

  if (loading) {
    return (
      <div className="container text-center" style={{ padding: "120px 0" }}>
        <p>Loading article...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container text-center" style={{ padding: "120px 0" }}>
        <h2>Article Not Found</h2>
        <Link to="/blog" className="btn btn-primary" style={{ marginTop: "20px" }}>
          Back to Blogs
        </Link>
      </div>
    );
  }

  return (
    <div
      className="page-top container"
      style={{
        maxWidth: "800px",
        padding: "100px 20px 40px", // Header overlay fix
        position: "relative"
      }}
    >
      <button
        onClick={() => navigate("/blog")}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "24px",
          color: "var(--text-muted)",
          cursor: "pointer",
          fontSize: "1rem",
          position: "relative",
          zIndex: 20 // Overlay block fix
        }}
      >
        <ArrowLeft size={16} /> Back to Blogs
      </button>

      <article className="blog-detail">
        <span className="badge badge-neutral">{post.category || "General"}</span>

        <h1 style={{ fontSize: "2.5rem", margin: "16px 0 12px" }}>
          {post.title}
        </h1>

        <div style={{ display: "flex", gap: "12px", color: "var(--text-muted)", marginBottom: "24px" }}>
          <span>
            <Clock size={14} />{" "}
            {post.read_time
              ? typeof post.read_time === "number" || !isNaN(post.read_time)
                ? `${post.read_time} min read`
                : post.read_time
              : "5 min read"}
          </span>
        </div>

        {post.image && (
          <img
            src={post.image}
            alt={post.title}
            style={{
              width: "100%",
              maxHeight: "450px",
              objectFit: "cover",
              borderRadius: "16px",
              marginBottom: "32px",
            }}
          />
        )}

        <div
          className="blog-content"
          style={{ lineHeight: "1.8", fontSize: "1.1rem" }}
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
