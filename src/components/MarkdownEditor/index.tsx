import React, { useEffect, useRef, useState } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
// import { history, historyKeymap } from '@codemirror/history';
import { syntaxHighlighting } from "@codemirror/language";
import {
    lineNumbers,
    highlightActiveLine,
    highlightActiveLineGutter,
} from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { HighlightStyle } from '@codemirror/language';
import { tags } from '@lezer/highlight';
// import { uploadImage } from './api'; // Make sure to provide the correct path for your API

const markdownHighlighting = HighlightStyle.define(
    [
        {
            tag: tags.heading1,
            fontSize: "1.6em",
            fontWeight: "bold"
        },
        {
            tag: tags.heading2,
            fontSize: "1.4em",
            fontWeight: "bold",
        },
        {
            tag: tags.heading3,
            fontSize: "1.2em",
            fontWeight: "bold",
        },
    ]
)

function MarkdownEditor({ initialValue, adminSettings, setRendered, handleChangeContent, forceLineNumbers }) {

    const editorRef = useRef(null)

    const [editorView, setEditorView] = useState(null)
    useEffect(() => {
        if (!editorRef) return

        const startState = EditorState.create({
            doc: initialValue,
            extensions: [
                basicSetup,
                lineNumbers(),
                highlightActiveLine(),
                highlightActiveLineGutter(),
                syntaxHighlighting(markdownHighlighting),
                markdown({ base: markdownLanguage }),
                EditorView.lineWrapping,
                EditorView.updateListener.of((update) => {
                    // if (update.docChanged) {
                    if (update.docChanged) {
                        console.log("change:", update.state.doc.toString())
                        setRendered(update.state.doc.toString());
                        handleChangeContent(update.state.doc.toString())
                    }
                    // }
                })
            ],
        })

        const view = new EditorView({
            parent: editorRef.current,
            state: startState,
        });

        // const handleScroll = () => {
        //     const { scrollHeight, clientHeight, scrollTop } = editorView.scrollDOM;
        //     const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
        //     onScroll(scrollPercentage);
        // };

        // editorView.scrollDOM.addEventListener('scroll', handleScroll);
        // return () => {
        //     editorView.scrollDOM.removeEventListener('scroll', handleScroll);
        //     editorView.destroy();
        // };
        setEditorView(view)
        return () => view.destroy()
    }, [editorRef]);

    useEffect(() => {
        console.log('ihi')
        console.log(initialValue)
        if (!editorView || !initialValue) {
            return
        }
        const transaction = editorView.state.update({
            changes: {
                from: 0,
                to: editorView.state.doc.length,
                insert: initialValue,
            },
            selection: editorView.state.selection,
        })

        editorView.dispatch(transaction)

    }, [initialValue, editorView])

    // useEffect(() => {
    //     if (editorRef.current && forceLineNumbers && !(adminSettings.editor || {}).lineNumbers) {
    //         editorRef.current.view.dispatch({
    //             effects: history(editorRef.current.view.state.update({
    //                 ...editorRef.current.view.state,
    //                 lineNumbers: forceLineNumbers,
    //             })),
    //         });
    //     }
    // }, [forceLineNumbers]);

    return [editorRef, editorView];
}

export default MarkdownEditor