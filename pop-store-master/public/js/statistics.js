document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/top-selling-products')
        .then(response => response.json())
        .then(data => {
            const statisticsTable = document.getElementById('statistics');
            data.forEach(product => {
                const row = document.createElement('tr');
                const productNameCell = document.createElement('td');
                const salesCell = document.createElement('td');

                productNameCell.textContent = product[0];
                salesCell.textContent = product[1];

                row.appendChild(productNameCell);
                row.appendChild(salesCell);
                statisticsTable.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching top-selling products:', error));
});
