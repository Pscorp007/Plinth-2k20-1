const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
const links = document.querySelectorAll('.nav-links li');
const sidebar = document.querySelectorAll('.sidebar_contain');
hamburger.addEventListener('click', () => {
	//Animate Links
	navLinks.classList.toggle('open');
	links.forEach((link) => {
		link.classList.toggle('fade');
	});
	sidebar.forEach((link) => {
		link.classList.remove('nav-navtab');
	});

	//Hamburger Animation
	hamburger.classList.toggle('toggle');
});