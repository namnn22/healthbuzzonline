import { GetServerSideProps } from 'next';
import { GraphQLClient, gql } from 'graphql-request';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const endpoint = process.env.GRAPHQL_ENDPOINT as string;
  const graphQLClient = new GraphQLClient(endpoint);
  
  // Getting the post path from the URL
  const pathArr = ctx.query.postpath as Array<string>;
  const path = pathArr.join('/');
  
  // Check if the request is coming from Facebook's crawler user agent
  const userAgent = ctx.req.headers['user-agent'] || '';
  const isFacebookCrawler = /facebookexternalhit|facebot/i.test(userAgent);

  if (isFacebookCrawler) {
    // If Facebook's crawler, return the metadata without redirecting
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
      return { notFound: true };
    }

    return {
      props: {
        post: data.post,
        path,
      },
    };
  } else {
    // If not Facebook's crawler, redirect immediately
    return {
      redirect: {
        destination: `https://www.healthbuzzonline.com/${path}`,
        permanent: false,
      },
    };
  }
};

interface PostProps {
  post: any;
  path: string;
}

const Post: React.FC<PostProps> = ({ post }) => {
  // This will only render for Facebook's crawler
  return (
    <>
      <Head>
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:url" content={`https://your-original-url.com/${post.link}`} />
        <meta property="og:image" content={post.featuredImage?.node?.sourceUrl} />
        <title>{post.title}</title>
      </Head>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </>
  );
};

export default Post;
