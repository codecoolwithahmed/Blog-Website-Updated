import { auth, db } from './firebaseconfig.js';
import { onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const userNameDisplay = document.getElementById('userNameDisplay');
const userEmailDisplay = document.getElementById('userEmailDisplay');
const blogListElement = document.getElementById('blog-list');
const newBlogForm = document.getElementById('newBlogForm');
const signOutButton = document.getElementById('sign-out');
const editUserInfoButton = document.getElementById('editUserInfoButton');
const saveUserInfoButton = document.getElementById('saveUserInfoButton');
const cancelEditUserInfoButton = document.getElementById('cancelEditUserInfoButton');
const editNameInput = document.getElementById('editName');
const editEmailInput = document.getElementById('editEmail');
const editBlogForm = document.getElementById('editBlogForm');
const editBlogIdInput = document.getElementById('editBlogId');
const editTitleInput = document.getElementById('editTitle');
const editBodyInput = document.getElementById('editBody');

let currentEditBlogId = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        userNameDisplay.textContent = user.displayName || 'No Name';
        userEmailDisplay.textContent = user.email || 'No Email';

        const q = query(collection(db, 'blogs'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        blogListElement.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const blog = doc.data();
            const blogId = doc.id;
            const blogElement = document.createElement('div');
            blogElement.className = 'blog-item';
            blogElement.innerHTML = `
                <h3>${blog.title}</h3>
                <p>${blog.body}</p>
                <small>Posted by: ${blog.userName || 'Anonymous'} on ${new Date(blog.timestamp?.seconds * 1000).toLocaleDateString()}</small>
                <div class="blog-actions">
                    <button class="edit-button" data-id="${blogId}">Edit</button>
                    <button class="delete-button" data-id="${blogId}">Delete</button>
                </div>
            `;
            blogListElement.appendChild(blogElement);
        });

        document.querySelectorAll('.edit-button').forEach(button => {
            button.addEventListener('click', handleEdit);
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', handleDelete);
        });
    } else {
        window.location.href = 'index.html';
    }
});

newBlogForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('title').value;
    const body = document.getElementById('body').value;

    if (auth.currentUser) {
        await addDoc(collection(db, 'blogs'), {
            title,
            body,
            userId: auth.currentUser.uid,
            userName: auth.currentUser.displayName || 'Anonymous',
            timestamp: new Date()
        });

        window.location.reload();
    }
});

signOutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Sign Out Error', error);
    }
});

editUserInfoButton.addEventListener('click', () => {
    userNameDisplay.style.display = 'none';
    userEmailDisplay.style.display = 'none';
    editNameInput.style.display = 'block';
    editEmailInput.style.display = 'block';
    editNameInput.value = userNameDisplay.textContent;
    editEmailInput.value = userEmailDisplay.textContent;

    editUserInfoButton.style.display = 'none';
    saveUserInfoButton.style.display = 'block';
    cancelEditUserInfoButton.style.display = 'block';
});

cancelEditUserInfoButton.addEventListener('click', () => {
    userNameDisplay.style.display = 'block';
    userEmailDisplay.style.display = 'block';
    editNameInput.style.display = 'none';
    editEmailInput.style.display = 'none';

    editUserInfoButton.style.display = 'block';
    saveUserInfoButton.style.display = 'none';
    cancelEditUserInfoButton.style.display = 'none';
});

saveUserInfoButton.addEventListener('click', async () => {
    const newName = editNameInput.value;
    const newEmail = editEmailInput.value;

    if (auth.currentUser) {
        try {
            await updateProfile(auth.currentUser, { displayName: newName });

            const userDoc = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDoc, {
                name: newName,
                email: newEmail
            });

            userNameDisplay.textContent = newName;
            userEmailDisplay.textContent = newEmail;

            userNameDisplay.style.display = 'block';
            userEmailDisplay.style.display = 'block';
            editNameInput.style.display = 'none';
            editEmailInput.style.display = 'none';

            editUserInfoButton.style.display = 'block';
            saveUserInfoButton.style.display = 'none';
            cancelEditUserInfoButton.style.display = 'none';
        } catch (error) {
            console.error('Error updating user info', error);
        }
    }
});

async function handleEdit(event) {
    currentEditBlogId = event.target.dataset.id;
    const blogDoc = doc(db, 'blogs', currentEditBlogId);
    const blogData = (await getDoc(blogDoc)).data();

    if (blogData) {
        const blogElement = event.target.closest('.blog-item');
        blogElement.innerHTML = `
            <div class="form-group">
                <label for="editTitle">Title:</label>
                <input type="text" id="editTitle" value="${blogData.title}" class="form-input">
            </div>
            <div class="form-group">
                <label for="editBody">Body:</label>
                <textarea id="editBody" rows="4" class="form-input">${blogData.body}</textarea>
            </div>
            <button type="button" id="updateBlogButton" class="form-button">Update</button>
            <button type="button" id="cancelEditBlogButton" class="form-button">Cancel</button>
        `;

        document.getElementById('updateBlogButton').addEventListener('click', handleUpdate);
        document.getElementById('cancelEditBlogButton').addEventListener('click', () => {
            window.location.reload();
        });
    }
}

async function handleUpdate() {
    const title = document.getElementById('editTitle').value;
    const body = document.getElementById('editBody').value;

    if (currentEditBlogId) {
        try {
            const blogDoc = doc(db, 'blogs', currentEditBlogId);
            await updateDoc(blogDoc, { title, body });

            window.location.reload();
        } catch (error) {
            console.error('Error updating blog', error);
        }
    }
}

async function handleDelete(event) {
    const blogId = event.target.dataset.id;

    if (confirm('Are you sure you want to delete this blog?')) {
        try {
            const blogDoc = doc(db, 'blogs', blogId);
            await deleteDoc(blogDoc);

            window.location.reload();
        } catch (error) {
            console.error('Error deleting blog', error);
        }
    }
}
