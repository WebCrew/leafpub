/* globals Nanobar, Leafpub */
$(function() {
    'use strict';

    var request,
        progress = new Nanobar(),
        tag = $('input[name="tag"]').val();

    function updateSearchEnginePreview() {
        var slug = $('#slug').val(),
            title =
                $.trim($('#meta-title').val()) ||
                $.trim($('#name').val()),
            description =
                $.trim($('#meta-description').val()) ||
                $.trim($(Leafpub.markdownToHtml($('#description').val())).text());

        $('.se-slug').text(slug);
        $('.se-title').text(title);
        $('.se-description').text(description);
    }

    // Submit
    $('.tag-form').on('submit', function(event) {
        var form = this,
            type = tag === '' ? 'POST' : 'PUT',
            url = Leafpub.url(
                type === 'POST' ? 'api/tags' : 'api/tags/' + encodeURIComponent(tag)
            );

        event.preventDefault();

        // Don't submit if another request is pending
        if(request) return;

        // Show progress
        progress.go(50);
        Leafpub.highlightErrors(form);

        // Send request
        request = $.ajax({
            url: url,
            type: type,
            data: $(this).serialize()
        })
        .done(function(res) {
            if(res.success) {
                // Prevent resubmissions
                $(form).off('submit').on('submit', function(event) {
                    event.preventDefault();
                });

                // Show feedback and redirect
                Leafpub.announce(
                    $('meta[name="leafpub:language"]').attr('data-changes-saved'),
                    { style: 'success' }
                ).then(function() {
                    location.href = Leafpub.adminUrl('tags');
                });
            } else {
                // Show errors
                Leafpub.highlightErrors(form, res.invalid);
                $.alertable.alert(res.message);
            }
        })
        .always(function() {
            request = null;
            progress.go(100);
        });
    });

    // Open
    $('.open').on('click', function() {
        window.open( $(this).attr('data-url') );
    });

    // Delete
    $('.delete').on('click', function() {
        var confirm = $(this).attr('data-confirm');

        // Confirmation
        $.alertable.confirm(confirm).then(function() {
            // Show progress
            progress.go(50);

            // Send request
            $.ajax({
                url: Leafpub.url('api/tags/' + encodeURIComponent(tag)),
                type: 'DELETE'
            })
            .done(function(res) {
                if(res.success) {
                    // Redirect
                    location.href = Leafpub.adminUrl('tags');
                } else {
                    // Show error
                    $.alertable.alert(res.message);
                }
            })
            .always(function() {
                // Hide progress
                progress.go(100);
            });
        });
    });

    // Submit button
    $('.submit').on('click', function() {
        $('.tag-form').submit();
    });

    // Enforce slug syntax
    $('#slug').on('change', function() {
        this.value = Leafpub.slug(this.value);
    });

    // Guess slug when name changes
    $('#name').on('change', function() {
        var slug = Leafpub.slug(this.value);

        // Only guess if no slug is present
        if($('#slug').val() === '') {
            $('#slug').val(slug);
        }
    });

    // Update name while typing
    $('#name').on('change keyup paste', function() {
        $('.cover-name').text(this.value);
    });

    // Update search engine preview
    $('#name, #description, #slug, #meta-title, #meta-description')
    .on('change keyup paste', updateSearchEnginePreview);
    updateSearchEnginePreview();

    // Upload cover
    $('.upload-cover').on('change', 'input[type="file"]', function(event) {
        var input = this;
        if(!event.target.files.length) return;

        // Upload it
        Leafpub.upload({
            accept: 'image',
            files: event.target.files[0],
            progress: function(percent) {
                progress.go(percent);
            }
        })
        .then(function(res) {
            // Reset the input
            $(input).replaceWith($(input).clone());

            // Update cover
            if(res.uploaded.length) {
                $('input[name="cover"]').val(res.uploaded[0].relative_path);
                $('.cover').css('background-image', 'url("' + res.uploaded[0].url + '")');
                $('.remove-cover').prop('hidden', false);
            }

            // Show feedback
            if(res.failed.length) {
                $.alertable.alert(res.failed[0].message);
            }
        });
    });

    // Remove cover
    $('.remove-cover').on('click', function() {
        $('input[name="cover"]').val('');
        $('.cover').css('background-image', 'none');
        $('.remove-cover').prop('hidden', true);
    });
});