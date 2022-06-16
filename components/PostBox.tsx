import { useSession } from 'next-auth/react'
import React, { useState } from 'react'
import Avatar from './Avatar'
import { LinkIcon, PhotographIcon } from "@heroicons/react/outline"
import { useForm } from "react-hook-form"
import { useMutation } from '@apollo/client'
import { ADD_POST, ADD_SUBREDDIT } from '../graphql/mutations'
import client from "../apollo-client"
import { GET_ALL_POSTS, GET_SUBREDDIT_BY_TOPIC } from '../graphql/queries'
import toast from 'react-hot-toast'

type FormData = {
  postTitle: string
  postBody: string
  postImage: string
  subreddit: string
}

type Props = {
  subreddit?: string
}

const PostBox = ({ subreddit }: Props) => {
  const { data: session } = useSession()
  const [ addPost ] = useMutation(ADD_POST , {
    refetchQueries: [GET_ALL_POSTS, "getPostList"],
  })
  const [ addSubreddit ] = useMutation(ADD_SUBREDDIT)

  const [imageBox, setImageBox] = useState<boolean>(false)

  const { 
    register,
    setValue, 
    handleSubmit, 
    watch, 
    formState: { errors }, 
  } = useForm<FormData>()

  const onSubmit = handleSubmit(async (formData) => {
    console.log(formData)
    const notification = toast.loading("Creating New Post...")

    try {
      // Query for Subreddit Topic
      const {
        data: { getSubredditListByTopic },
      } = await client.query({
        query: GET_SUBREDDIT_BY_TOPIC,
        variables: {
          topic: subreddit || formData.subreddit,
        },
      })
      
      const subredditExits = getSubredditListByTopic.length > 0

      if (!subredditExits) {
        // Create Subreddit
        console.log("Subreddit is New")

        const {
          data: { insertSubreddit: newSubreddit },
        } = await addSubreddit({
          variables: {
            topic: formData.subreddit,
          },
        })
        
        console.log("Creating Post", formData)

        const image = formData.postImage || ""

        const {
          data: { insertPost: newPost },
        } = await addPost({
          variables: {
            body: formData.postBody,
            image: image,
            subreddit_id: newSubreddit.id,
            title: formData.postTitle,
            username: session?.user?.name,
          },
        })

        console.log("New Post Added", newPost)
      } else {
        // Use Existing Subreddit
        console.log("Using Existing Subreddit")
        console.log(getSubredditListByTopic)
        
        const image = formData.postImage || ""

        const {
          data: { insertPost: newPost },
        } = await addPost({
          variables: {
            body: formData.postBody,
            image: image,
            subreddit_id: getSubredditListByTopic[0].id,
            title: formData.postTitle,
            username: session?.user?.name,
          }
        })

        console.log("New Post Added", newPost)
      }
    
      // After Post Added
      setValue("postBody", "")
      setValue("postImage", "")
      setValue("postTitle", "")
      setValue("subreddit", "")

      toast.success("New Post Created", {
        id: notification,
      })    
    } catch (error) {
      console.log(error);
      
      toast.error("Something Went Wrong", {
        id: notification,
      })
    }
  })

  return (
    <form 
      onSubmit={onSubmit}
      className="sticky top-20 z-50 rounded-md border border-gray-300 bg-white p-2"
    >
      <div className="flex items-center space-x-3">
        {/* Avatar */}
        <Avatar />

        <input
          {...register('postTitle', { required: true })}
          disabled={!session}
          className="flex-1 rounded-md bg-gray-50 p-2 pl-5 outline-none"
          type="text"
          placeholder={
            session ? subreddit ? `Create a post in r/${subreddit}` : "Create a Post By Entering a Title" : "Sign In to Post"
          }
        />

        <PhotographIcon
          onClick={() => setImageBox(!imageBox)}
          className={`h-6 cursor-pointer text-gray-300 ${
            imageBox && 'text-blue-300'
          }`}
        />
        <LinkIcon className="h-6 text-gray-300" />
      </div>

      {!!watch('postTitle') && (
        <div className="flex flex-col py-2">
          {/* Body */}
          <div className="flex items-center px-2">
            <p className="min-w-[90px]">Body</p>
            <input 
              className="m-2 flex-1 bg-blue-50 p-2 outline-none"
              {...register('postBody')}
              type="text"
              placeholder="Text (Optional)"
            />
          </div>
          
          {/* Subreddit */}
          {!subreddit && (
            <div className="flex items-center px-2">
              <p className="min-w-[90px]">Subreddit</p>
              <input 
                className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                {...register('subreddit', { required: true })}
                type="text"
                placeholder="Text"
              />
            </div>
          )}
          
          {imageBox && (
              <div className="flex items-center px-2">
                <p className="min-w-[90px]">Image URL</p>
                <input 
                  className="m-2 flex-1 bg-blue-50 p-2 outline-none"
                  {...register('postImage')}
                  type="text"
                  placeholder="Image (Optional)"
                />
              </div>
          )}

          {/*  Error */}
          {Object.keys(errors).length > 0 && (
            <div className="space-y-2 p-2 text-red-500">
              {errors.postTitle?.type === 'required' && (
                <p>- A Post Title is Required</p>
              )}

              {errors.subreddit?.type === 'required' && (
                <p>- A Subreddit Title is Required</p>
              )}
            </div>
          )}

          {!!watch('postTitle') && (
            <button 
              type="submit"
              className="w-full rounded-full bg-blue-400 p-2 text-white"
            >
              Create Post
            </button>
          )}
        </div>
      )}
    </form>
  )
}

export default PostBox