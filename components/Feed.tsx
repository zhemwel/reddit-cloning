import { useQuery } from '@apollo/client'
import { Jelly } from '@uiball/loaders'
import React from 'react'
import { GET_ALL_POSTS, GET_ALL_POSTS_BY_TOPIC } from '../graphql/queries'
import Post from './Post'

type Props = {
  topic?: string
}

const Feed = ({ topic }: Props) => {
  const { data, error } = !topic
  ? useQuery(GET_ALL_POSTS)
  : useQuery(GET_ALL_POSTS_BY_TOPIC, {
    variables: {
      topic: topic,
    },
  })

  const posts: Post[] = !topic ? data?.getPostList : data?.getPostListByTopic

  if (!posts)
    return (
      <div className="flex w-full items-center justify-center p-10 text-xl">
        <Jelly size={50} color="#FF4501" />
      </div>
    )

  return (
    <div className="mt-5 space-y-4">
      {posts?.map((post) => (
        <Post key={post.id} post={post} />
      ))}
    </div>
  )
}

export default Feed