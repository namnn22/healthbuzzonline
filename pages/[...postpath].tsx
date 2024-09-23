import React, { useEffect } from 'react';
import Head from 'next/head';
import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const endpoint = process.env.GRAPHQL_ENDPOINT as string;
  const graphQLClient = new GraphQLClient(endpoint);
  
  // Getting the post path from the URL
  const pathArr = ctx.query.postpath as Array<string>;
  const path = pathArr.join('/');
  const referringURL = ctx.req.headers?.referer || null;
  const fbclid = ctx.query.fbclid || null;

  // GraphQL query to fetch post data
  const query = gql`
    {
      post(id: "/${path}/", idType: URI) {
        id
        excerpt
        title
        link
        dateGmt
        modifiedGmt
        content
        author {
          node {
            name
          }
        }
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
      }
    }
  `;

  const data = await graphQLClient.request(query);
  if (!data.post) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      path,
      post: data.post,
      host: ctx.req.headers.host,
      referringURL,
      fbclid,
    },
  };
};

interface PostProps {
  post: any;
  host: string;
  path: string;
  referringURL: string | null;
  fbclid: string | null;
}

const Post: React.FC<PostProps> = ({ post, host, path, referringURL, fbclid }) => {
  useEffect(() => {
    // Log for debugging
    console.log("useEffect running - Redirect Check");
    console.log("Referrer:", referringURL);
    console.log("FBCLID:", fbclid);

    // Redirect if the user is coming from Facebook or if fbclid exists in the URL
    if (referringURL?.includes('facebook.com') || fbclid) {
      console.log("Redirecting to:", `https://healthbuzzonline.com/${path}`);
      window.location.replace(`https://healthbuzzonline.com/${path}`);
    }
  }, [referringURL, fbclid, path]);

  // Utility function to remove HTML tags from the excerpt
  const removeTags = (str: string) => {
    if (!str) return '';
    return str.replace(/(<([^>]+)>)/gi, '').replace(/\[[^\]]*\]/g, '');
  };

  return (
    <>
      <Head>
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={removeTags(post.excerpt)} />
        <meta property="og:url" content={`https://${host}/${path}`} />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content={host.split('.')[0]} />
        <meta property="article:published_time" content={post.dateGmt} />
        <meta property="article:modified_time" content={post.modifiedGmt} />
        
        {post.featuredImage?.node?.sourceUrl && (
          <>
            <meta property="og:image" content={post.featuredImage.node.sourceUrl} />
            <meta property="og:image:alt" content={post.featuredImage?.node?.altText || post.title} />
          </>
        )}
        
        <link rel="canonical" href={`https://${host}/${path}`} />
        <title>{post.title}</title>
      </Head>

      <div className="post-container">
        <h1>{post.title}</h1>
        {post.featuredImage?.node?.sourceUrl && (
          <img
            src={post.featuredImage.node.sourceUrl}
            alt={post.featuredImage.node.altText || post.title}
          />
        )}
        <article dangerouslySetInnerHTML={{ __html: post.content }} />
      </div>
    </>
  );
};

export default Post;
