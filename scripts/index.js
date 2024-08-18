import { db } from './firebaseconfig.js';
import { collection, query, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const blogsContainer = document.getElementById('blogsContainer');

async function fetchBlogs() {
    const blogsCollection = collection(db, 'blogs');
    const q = query(blogsCollection, orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);

    blogsContainer.innerHTML = '';

    querySnapshot.forEach((doc) => {
        const blog = doc.data();
        const blogElement = document.createElement('div');
        blogElement.className = 'blog-item';
        blogElement.innerHTML = `
            <h3>${blog.title}</h3>
            <p>${blog.body}</p>
            <small>Posted by: ${blog.userName || 'Anonymous'} on ${new Date(blog.timestamp?.seconds * 1000).toLocaleDateString()}</small>
        `;
        blogsContainer.appendChild(blogElement);
    });
}

fetchBlogs();
