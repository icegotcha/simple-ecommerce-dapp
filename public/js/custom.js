const domain = 'http://localhost:3000';

// Display file name on file input when user selected file
$('.custom-file-input').on('change', function() {
  const fileName = $(this)
    .val()
    .split('\\')
    .pop();
  $(this)
    .siblings('.custom-file-label')
    .addClass('selected')
    .html(fileName);
});

// Change value of product seller in `Add Product` form when
// user selected address in navbar
const selected = $('#addressSelector')
  .find(':selected')
  .text();
$('#addProductForm input[name=productSeller]').val(selected);

$('#addressSelector').on('change', function() {
  const selected = $(this)
    .find(':selected')
    .text();
  $('#addProductForm input[name=productSeller]').val(selected);
});

$('#addProductForm').on('submit', function(event) {
  event.preventDefault();
  const submitButton = $(this).find('input[type=submit]');

  submitButton.val('Proceeding...');
  submitButton.prop('disabled', true);

  const data = new FormData($(this)[0]);
  $.ajax({
    url: `${domain}/products/add`,
    type: 'POST',
    data: data,
    processData: false,
    contentType: false,
    cache: false,
    success: function(result) {
      submitButton.val('Submit');
      submitButton.prop('disabled', false);
      if (result.success) {
        toastr.success(
          'Please wait, this page will be refresh automatically.',
          'Success',
          {
            onHidden: function() {
              location.reload();
            }
          }
        );
      } else {
        toastr.error(result.error, `Failed`);
      }
    }
  });
});

// When user click `Buy` button
$('.btn-buy').on('click', function(event) {
  event.preventDefault();
  const productDescElement = $(this).prev();
  const pid = productDescElement.find('.product-id').text();
  const pn = productDescElement.find('.product-name').text();
  const pqElement = productDescElement.find('.product-quantity');
  const pq = pqElement.text();

  if (pq == 0) {
    toastr.error('Product is sold out', `Failed`);
    return;
  }

  $('#buyProductModal #confirmedProductName').text(pn);
  $('#buyProductModal #confirmedProductId').val(pid);
  $('#buyProductModal #confirmedProductQty').val(pq);

  $('#buyProductModal').modal('show');
});

// When click "Yes" on buy confirmation dialog
$('.btn-confirm-buy').on('click', function(event) {
  event.preventDefault();
  const pn = $('#buyProductModal #confirmedProductName').text();
  const pid = $('#buyProductModal #confirmedProductId').val();
  const buyerPassword = $('#buyProductModal #confirmedAddressPassword').val();
  const buyer = $('#addressSelector')
    .find(':selected')
    .text();

  $.post(`${domain}/products/buy`, {
    pid: pid,
    buyer: buyer,
    password: buyerPassword
  }).done(function(result) {
    if (result.success) {
      toastr.success(`You bought ${pn} 1 piece.`, 'Success', {
        onHidden: function() {
          location.reload();
        }
      });
    } else {
      toastr.error(result.error, `Failed`);
    }
  });
});
